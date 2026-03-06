from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ─── Comp Generator ──────────────────────────────────────────────────────────

COMP_SYSTEM_PROMPT = """You are a professional real estate comparable sales (comps) analysis engine for wholesalers and investors.
Given a property address and optional repair cost, return ONLY raw valid JSON — no markdown, no backticks, no explanation.

COMP SELECTION RULES:
- Find 3-5 best comparable recently sold properties
- Same property type (single family preferred)
- Bedrooms ±1, Bathrooms ±1, Sqft ±300 of subject
- Sold within last 6 months (expand to 12 if needed)
- Within 0.5 miles (expand to 1 mile if needed)
- EXCLUDE: new construction, luxury remodels, extreme outlier prices

ADJUSTMENTS: sqft diff × $85/sqft | bedroom diff × $4,000 | bathroom diff × $2,500

CALCULATIONS:
- ARV = Average Adjusted Price Per Sqft × Subject Sqft
- MAO = (ARV × 0.70) − Repair Cost
- Investor Spread = ARV − MAO − Repair Cost
- Deal Score 1–10: 9-10=deep discount/strong comps, 7-8=good deal, 5-6=marginal, 1-4=bad
- Comp Confidence: High=3+ comps ≤0.5mi sold ≤90 days, Medium=2-3 comps or older, Low=<2 comps

JSON SCHEMA (return exactly this structure):
{"subject_property":{"address":"string","beds":0,"baths":0,"sqft":0,"year_built":0,"lot_size":"string","property_type":"Single Family","estimated_value":0},"comps":[{"address":"string","beds":0,"baths":0,"sqft":0,"sold_price":0,"price_per_sqft":0,"distance_miles":0.0,"sale_date":"YYYY-MM-DD","adjusted_price":0,"adjustment_notes":"string"}],"metrics":{"avg_price_per_sqft":0,"median_price_per_sqft":0,"highest_comp":0,"lowest_comp":0,"comp_count":0},"arv":0,"repair_cost":0,"mao":0,"investor_spread":0,"deal_score":0.0,"comp_confidence":"High","data_source":"AI Analysis","summary":"string","deal_quality_notes":["string"]}"""


class CompRequest(BaseModel):
    address: str
    repair_cost: Optional[float] = 0.0

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/comps/generate")
async def generate_comps(request: CompRequest):
    address = request.address.strip()
    repair_cost = request.repair_cost or 0.0
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")

    real_data_context = ""
    data_source = "AI Analysis"

    # ── Step 1: Try HomeHarvest for real MLS data ──────────────────────────
    try:
        def fetch_homeharvest():
            from homeharvest import scrape_property
            import pandas as pd
            parts = address.split(',')
            area = ','.join(parts[-2:]).strip() if len(parts) >= 2 else address
            props = scrape_property(location=area, listing_type="sold", past_days=180)
            if props is not None and not props.empty:
                cols = ['full_street_line', 'city', 'state', 'beds', 'full_baths',
                        'sqft', 'sold_price', 'last_sold_date', 'year_built']
                available = [c for c in cols if c in props.columns]
                clean = props[available].dropna(subset=['sold_price', 'sqft'])
                clean = clean.fillna(0)
                return clean.head(20).to_dict('records')
            return []

        loop = asyncio.get_event_loop()
        comps_data = await asyncio.wait_for(
            loop.run_in_executor(None, fetch_homeharvest), timeout=18.0
        )
        if comps_data:
            real_data_context = (
                f"\nREAL MLS DATA from Realtor.com ({len(comps_data)} recent sold properties):\n"
                + json.dumps(comps_data, default=str)[:3000]
                + "\nUse this real data as primary source. Filter for best comps."
            )
            data_source = "Realtor.com MLS + AI Analysis"
            logger.info(f"HomeHarvest: {len(comps_data)} comps for {area}")
    except asyncio.TimeoutError:
        logger.warning("HomeHarvest timed out — using AI analysis")
    except Exception as e:
        logger.warning(f"HomeHarvest error: {e}")

    # ── Step 2: Claude Sonnet analysis ─────────────────────────────────────
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"comp-{uuid.uuid4()}",
            system_message=COMP_SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        prompt = (
            f"Property Address: {address}\n"
            f"Repair Cost Estimate: ${repair_cost:,.0f}\n"
            + (real_data_context if real_data_context
               else "\nNo real MLS data — generate realistic comp estimates based on your knowledge of this market.")
            + "\n\nReturn ONLY raw JSON, no markdown."
        )

        response = await chat.send_message(UserMessage(text=prompt))

        # Parse JSON robustly
        text = response.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()

        result = json.loads(text)
        result['data_source'] = data_source
        result['repair_cost'] = repair_cost
        arv = float(result.get('arv', 0))
        result['mao'] = round((arv * 0.70) - repair_cost, 0)
        result['investor_spread'] = round(arv - result['mao'] - repair_cost, 0)
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI analysis")
    except Exception as e:
        logger.error(f"Comp generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()