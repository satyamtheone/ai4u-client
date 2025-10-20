from typing import Optional, List, Dict, Union, Literal
from datetime import datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, validator, EmailStr
from pydantic.config import ConfigDict

# ============================================================================
# ENUMS AND CONSTANTS
# ============================================================================

class PaymentMode(str, Enum):
    COD = "COD"
    PREPAID = "PREPAID"
    PARTIAL_COD = "PARTIAL_COD"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CourierGrade(str, Enum):
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D = "D"

class OrderStatus(str, Enum):
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    RTO_INITIATED = "RTO_INITIATED"
    RTO_DELIVERED = "RTO_DELIVERED"
    CANCELLED = "CANCELLED"

class AlertType(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    WARNING = "WARNING"
    INFO = "INFO"

class SystemStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    OUTAGE = "OUTAGE"
    MAINTENANCE = "MAINTENANCE"

# ============================================================================
# BASE MODELS
# ============================================================================

class BaseResponse(BaseModel):
    """Base response model with common fields"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = Field(None, description="Unique request identifier")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")

class ErrorDetail(BaseModel):
    """Error detail model"""
    field: Optional[str] = None
    provided: Optional[Union[str, int, float]] = None
    expected: Optional[str] = None
    message: str

class APIError(BaseModel):
    """Standard API error response"""
    error: Dict[str, Union[str, List[ErrorDetail]]] = Field(
        ...,
        example={
            "code": "INVALID_REQUEST",
            "message": "Validation failed",
            "details": [
                {
                    "field": "order_number",
                    "provided": None,
                    "expected": "string",
                    "message": "Order number is required"
                }
            ]
        }
    )

# ============================================================================
# CUSTOMER AND ORDER MODELS
# ============================================================================

class CustomerInfo(BaseModel):
    """Customer information model"""
    phone: str = Field(..., min_length=10, max_length=15, description="Customer phone number")
    email: Optional[EmailStr] = Field(None, description="Customer email address")
    address: str = Field(..., min_length=10, max_length=500, description="Full delivery address")
    landmark: Optional[str] = Field(None, max_length=100, description="Address landmark")
    city: str = Field(..., min_length=2, max_length=50, description="City name")
    state: str = Field(..., min_length=2, max_length=50, description="State name")
    pincode: str = Field(..., regex=r"^\d{6}$", description="6-digit pincode")
    country: str = Field(default="IN", description="Country code")
    
    @validator('phone')
    def validate_phone(cls, v):
        # Remove any non-digit characters and validate
        digits_only = ''.join(filter(str.isdigit, v))
        if len(digits_only) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return digits_only

class CustomerHistory(BaseModel):
    """Customer historical data"""
    total_orders: int = Field(0, ge=0, description="Total orders placed by customer")
    successful_orders: int = Field(0, ge=0, description="Successfully delivered orders")
    rto_count: int = Field(0, ge=0, description="Number of RTO orders")
    cancelled_orders: int = Field(0, ge=0, description="Number of cancelled orders")
    avg_order_value: Decimal = Field(Decimal('0'), ge=0, description="Average order value")
    first_order_date: Optional[datetime] = Field(None, description="Date of first order")
    last_order_date: Optional[datetime] = Field(None, description="Date of last order")
    customer_tier: Optional[Literal["BRONZE", "SILVER", "GOLD", "PLATINUM"]] = None
    
    @validator('successful_orders', 'rto_count', 'cancelled_orders')
    def validate_order_counts(cls, v, values):
        total = values.get('total_orders', 0)
        if v > total:
            raise ValueError('Order count cannot exceed total orders')
        return v

class OrderDetails(BaseModel):
    """Order details model"""
    value: Decimal = Field(..., gt=0, description="Total order value")
    quantity: int = Field(..., gt=0, description="Number of items")
    weight: Decimal = Field(..., gt=0, description="Total weight in kg")
    length: Optional[Decimal] = Field(None, gt=0, description="Package length in cm")
    width: Optional[Decimal] = Field(None, gt=0, description="Package width in cm")
    height: Optional[Decimal] = Field(None, gt=0, description="Package height in cm")
    payment_mode: PaymentMode = Field(..., description="Payment mode")
    cod_amount: Optional[Decimal] = Field(None, ge=0, description="COD amount if applicable")
    created_at: datetime = Field(..., description="Order creation timestamp")
    expected_delivery_date: Optional[datetime] = Field(None, description="Expected delivery date")
    priority: Optional[Literal["LOW", "NORMAL", "HIGH", "URGENT"]] = Field("NORMAL", description="Order priority")
    category: Optional[str] = Field(None, max_length=50, description="Product category")
    is_fragile: bool = Field(False, description="Whether order contains fragile items")
    is_high_value: bool = Field(False, description="Whether order is high-value")
    
    @validator('cod_amount')
    def validate_cod_amount(cls, v, values):
        payment_mode = values.get('payment_mode')
        if payment_mode in [PaymentMode.COD, PaymentMode.PARTIAL_COD] and not v:
            raise ValueError('COD amount is required for COD orders')
        return v

class CourierInfo(BaseModel):
    """Courier information model"""
    name: str = Field(..., min_length=2, max_length=100, description="Courier partner name")
    service_type: str = Field(..., description="Service type (standard, express, premium)")
    tracking_number: Optional[str] = Field(None, description="Tracking number if available")
    pickup_date: Optional[datetime] = Field(None, description="Pickup date")
    estimated_delivery: Optional[datetime] = Field(None, description="Estimated delivery date")
    current_location: Optional[str] = Field(None, description="Current package location")

# ============================================================================
# PREDICTION MODELS
# ============================================================================

class RiskFactor(BaseModel):
    """Individual risk factor model"""
    factor: str = Field(..., description="Risk factor name")
    impact: float = Field(..., ge=0, le=1, description="Impact score (0-1)")
    description: str = Field(..., description="Human-readable description")
    category: Optional[Literal["PAYMENT", "GEOGRAPHIC", "COURIER", "CUSTOMER", "ORDER"]] = None

class RecommendationAction(BaseModel):
    """Recommendation action model"""
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = Field(..., description="Action priority")
    action: str = Field(..., description="Action identifier")
    description: str = Field(..., description="Action description")
    expected_impact: str = Field(..., description="Expected impact description")
    cost_estimate: Optional[Decimal] = Field(None, ge=0, description="Estimated cost of action")
    time_to_implement: Optional[str] = Field(None, description="Time required to implement")
    deadline: Optional[datetime] = Field(None, description="Action deadline if applicable")

class SimilarOrder(BaseModel):
    """Similar order model"""
    similarity_score: float = Field(..., ge=0, le=1, description="Similarity score (0-1)")
    order_number: str = Field(..., description="Similar order number")
    outcome: str = Field(..., description="Order outcome")
    courier: str = Field(..., description="Courier used")
    city: str = Field(..., description="Delivery city")
    payment_mode: PaymentMode = Field(..., description="Payment mode")
    delivery_date: Optional[datetime] = Field(None, description="Actual delivery date")

class PredictionResult(BaseModel):
    """Single prediction result"""
    rto_probability: float = Field(..., ge=0, le=1, description="RTO probability (0-1)")
    risk_level: RiskLevel = Field(..., description="Risk classification")
    confidence_score: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    
    @validator('risk_level')
    def validate_risk_level(cls, v, values):
        prob = values.get('rto_probability', 0)
        # Auto-assign risk level based on probability if not provided correctly
        if prob >= 0.75:
            expected = RiskLevel.CRITICAL
        elif prob >= 0.50:
            expected = RiskLevel.HIGH
        elif prob >= 0.25:
            expected = RiskLevel.MEDIUM
        else:
            expected = RiskLevel.LOW
        return expected

class SinglePredictionRequest(BaseModel):
    """Single order prediction request"""
    order_number: str = Field(..., min_length=1, max_length=100, description="Unique order number")
    customer: CustomerInfo = Field(..., description="Customer information")
    order_details: OrderDetails = Field(..., description="Order details")
    courier: CourierInfo = Field(..., description="Courier information")
    customer_history: Optional[CustomerHistory] = Field(None, description="Customer historical data")
    additional_features: Optional[Dict[str, Union[str, int, float]]] = Field(None, description="Additional custom features")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "order_number": "ORD-2025-789234",
                "customer": {
                    "phone": "9876543210",
                    "address": "123 Main St, Sector 15",
                    "city": "GURGAON",
                    "state": "HARYANA", 
                    "pincode": "122001"
                },
                "order_details": {
                    "value": 2847.50,
                    "quantity": 2,
                    "weight": 1.5,
                    "payment_mode": "COD",
                    "cod_amount": 2847.50,
                    "created_at": "2025-07-22T18:45:00Z"
                },
                "courier": {
                    "name": "AMAZON",
                    "service_type": "standard"
                }
            }
        }
    )

class SinglePredictionResponse(BaseResponse):
    """Single prediction response"""
    order_number: str = Field(..., description="Order number")
    prediction: PredictionResult = Field(..., description="Prediction result")
    risk_factors: List[RiskFactor] = Field(default_factory=list, description="Contributing risk factors")
    recommendations: List[RecommendationAction] = Field(default_factory=list, description="Recommended actions")
    similar_orders: List[SimilarOrder] = Field(default_factory=list, description="Similar historical orders")

class BatchPredictionOptions(BaseModel):
    """Batch prediction options"""
    include_recommendations: bool = Field(True, description="Include recommendations in response")
    include_similar_orders: bool = Field(False, description="Include similar orders in response")
    include_risk_factors: bool = Field(True, description="Include risk factors in response")
    risk_threshold: float = Field(0.5, ge=0, le=1, description="Risk threshold for filtering")
    max_similar_orders: int = Field(3, ge=0, le=10, description="Maximum similar orders to return")

class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    orders: List[SinglePredictionRequest] = Field(..., min_items=1, max_items=1000, description="List of orders to predict")
    options: Optional[BatchPredictionOptions] = Field(default_factory=BatchPredictionOptions, description="Batch options")
    
    @validator('orders')
    def validate_unique_order_numbers(cls, v):
        order_numbers = [order.order_number for order in v]
        if len(order_numbers) != len(set(order_numbers)):
            raise ValueError('Duplicate order numbers found in batch')
        return v

class BatchSummary(BaseModel):
    """Batch processing summary"""
    high_risk_count: int = Field(0, ge=0, description="Count of high-risk orders")
    medium_risk_count: int = Field(0, ge=0, description="Count of medium-risk orders")
    low_risk_count: int = Field(0, ge=0, description="Count of low-risk orders")
    critical_risk_count: int = Field(0, ge=0, description="Count of critical-risk orders")
    avg_risk_score: float = Field(0, ge=0, le=1, description="Average risk score")
    total_estimated_cost: Optional[Decimal] = Field(None, ge=0, description="Total estimated RTO cost")

class BatchPredictionResponse(BaseResponse):
    """Batch prediction response"""
    batch_id: str = Field(..., description="Unique batch identifier")
    total_orders: int = Field(..., ge=0, description="Total orders processed")
    processed_orders: int = Field(..., ge=0, description="Successfully processed orders")
    failed_orders: int = Field(0, ge=0, description="Failed order count")
    summary: BatchSummary = Field(..., description="Batch summary statistics")
    predictions: List[SinglePredictionResponse] = Field(default_factory=list, description="Individual predictions")
    failed_order_numbers: List[str] = Field(default_factory=list, description="List of failed order numbers")

# ============================================================================
# SYSTEM STATUS AND HEALTH MODELS
# ============================================================================

class ModelMetrics(BaseModel):
    """Model performance metrics"""
    accuracy: float = Field(..., ge=0, le=1, description="Model accuracy")
    precision: float = Field(..., ge=0, le=1, description="Model precision")
    recall: float = Field(..., ge=0, le=1, description="Model recall")
    f1_score: float = Field(..., ge=0, le=1, description="F1 score")
    auc_roc: Optional[float] = Field(None, ge=0, le=1, description="AUC-ROC score")

class SystemHealthResponse(BaseResponse):
    """System health response"""
    status: SystemStatus = Field(..., description="Overall system status")
    model_status: Literal["ACTIVE", "TRAINING", "INACTIVE"] = Field(..., description="ML model status")
    uptime_percentage: float = Field(..., ge=0, le=100, description="System uptime percentage")
    circuit_breaker_state: Literal["CLOSED", "OPEN", "HALF_OPEN"] = Field(..., description="Circuit breaker state")
    memory_usage_mb: float = Field(..., ge=0, description="Memory usage in MB")
    api_response_time_ms: float = Field(..., ge=0, description="Average API response time")
    predictions_today: int = Field(..., ge=0, description="Total predictions made today")
    high_risk_orders: int = Field(..., ge=0, description="High-risk orders detected today")
    last_model_update: datetime = Field(..., description="Last model update timestamp")
    error_count_24h: int = Field(0, ge=0, description="Error count in last 24 hours")
    throughput_per_minute: float = Field(..., ge=0, description="Requests per minute")

class PerformanceMetrics(BaseModel):
    """Detailed performance metrics"""
    prediction_latency: Dict[str, float] = Field(..., description="Latency metrics (avg_ms, p95_ms, p99_ms)")
    accuracy_metrics: ModelMetrics = Field(..., description="Model accuracy metrics")
    business_metrics: Dict[str, Union[float, int]] = Field(..., description="Business impact metrics")

class SystemMetricsResponse(BaseResponse):
    """System metrics response"""
    performance_metrics: PerformanceMetrics = Field(..., description="Performance metrics")

# ============================================================================
# ANALYTICS MODELS
# ============================================================================

class DateRange(BaseModel):
    """Date range model"""
    date_from: datetime = Field(..., description="Start date")
    date_to: datetime = Field(..., description="End date")
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        date_from = values.get('date_from')
        if date_from and v <= date_from:
            raise ValueError('date_to must be after date_from')
        return v

class TrendDataPoint(BaseModel):
    """Single trend data point"""
    date: datetime = Field(..., description="Data point date")
    value: Union[int, float] = Field(..., description="Metric value")
    label: Optional[str] = Field(None, description="Optional label")

class RiskDistribution(BaseModel):
    """Risk level distribution"""
    critical: int = Field(0, ge=0, description="Critical risk orders")
    high: int = Field(0, ge=0, description="High risk orders")
    medium: int = Field(0, ge=0, description="Medium risk orders")
    low: int = Field(0, ge=0, description="Low risk orders")

class AnalyticsOverviewRequest(BaseModel):
    """Analytics overview request"""
    date_from: Optional[datetime] = Field(None, description="Start date filter")
    date_to: Optional[datetime] = Field(None, description="End date filter")
    courier_filter: Optional[str] = Field(None, description="Courier name filter")
    risk_level: Optional[RiskLevel] = Field(None, description="Risk level filter")
    state_filter: Optional[str] = Field(None, description="State filter")
    city_filter: Optional[str] = Field(None, description="City filter")

class AnalyticsSummary(BaseModel):
    """Analytics summary statistics"""
    total_predictions: int = Field(..., ge=0, description="Total predictions made")
    accuracy: float = Field(..., ge=0, le=100, description="Model accuracy percentage")
    rto_rate_predicted: float = Field(..., ge=0, le=100, description="Predicted RTO rate")
    rto_rate_actual: float = Field(..., ge=0, le=100, description="Actual RTO rate")
    cost_savings: Decimal = Field(..., ge=0, description="Cost savings amount")
    roi_percentage: float = Field(..., ge=0, description="Return on investment")

class AnalyticsOverviewResponse(BaseResponse):
    """Analytics overview response"""
    period: DateRange = Field(..., description="Analysis period")
    summary: AnalyticsSummary = Field(..., description="Summary statistics")
    risk_distribution: RiskDistribution = Field(..., description="Risk level distribution")
    trends: Dict[str, List[TrendDataPoint]] = Field(default_factory=dict, description="Trend data")

# ============================================================================
# COURIER ANALYTICS MODELS
# ============================================================================

class GeographicPerformance(BaseModel):
    """Geographic performance data"""
    state: str = Field(..., description="State name")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")
    orders: int = Field(..., ge=0, description="Number of orders")
    avg_delivery_time: Optional[float] = Field(None, ge=0, description="Average delivery time in days")

class CourierPerformance(BaseModel):
    """Courier performance metrics"""
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")
    total_orders: int = Field(..., ge=0, description="Total orders handled")
    rto_orders: int = Field(..., ge=0, description="RTO orders")
    avg_delivery_time_days: float = Field(..., ge=0, description="Average delivery time in days")
    avg_order_value: Decimal = Field(..., ge=0, description="Average order value")
    grade: CourierGrade = Field(..., description="Performance grade")
    trend: str = Field(..., description="Performance trend (e.g., '+2.1%')")
    cost_per_delivery: Optional[Decimal] = Field(None, ge=0, description="Cost per delivery")
    on_time_percentage: Optional[float] = Field(None, ge=0, le=100, description="On-time delivery percentage")

class CourierAnalytics(BaseModel):
    """Courier analytics data"""
    name: str = Field(..., description="Courier name")
    performance: CourierPerformance = Field(..., description="Performance metrics")
    geographic_performance: List[GeographicPerformance] = Field(default_factory=list, description="Geographic breakdown")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for courier")
    market_share: Optional[float] = Field(None, ge=0, le=100, description="Market share percentage")

class IndustryBenchmarks(BaseModel):
    """Industry benchmark data"""
    avg_success_rate: float = Field(..., ge=0, le=100, description="Industry average success rate")
    top_quartile: float = Field(..., ge=0, le=100, description="Top quartile performance")
    bottom_quartile: float = Field(..., ge=0, le=100, description="Bottom quartile performance")
    median_delivery_time: Optional[float] = Field(None, ge=0, description="Median delivery time")

class CourierAnalyticsResponse(BaseResponse):
    """Courier analytics response"""
    couriers: List[CourierAnalytics] = Field(..., description="List of courier analytics")
    industry_benchmarks: IndustryBenchmarks = Field(..., description="Industry benchmarks")
    total_couriers: int = Field(..., ge=0, description="Total number of couriers analyzed")

# ============================================================================
# GEOGRAPHIC MODELS
# ============================================================================

class GeographicRiskFactor(BaseModel):
    """Geographic risk factor"""
    factor: str = Field(..., description="Risk factor name")
    description: str = Field(..., description="Factor description")
    impact_score: Optional[float] = Field(None, ge=0, le=1, description="Impact score")

class CityData(BaseModel):
    """City-level data"""
    city: str = Field(..., description="City name")
    rto_rate: float = Field(..., ge=0, le=100, description="RTO rate percentage")
    orders: int = Field(..., ge=0, description="Number of orders")
    avg_delivery_time: Optional[float] = Field(None, ge=0, description="Average delivery time")

class GeographicRegion(BaseModel):
    """Geographic region data"""
    region_code: str = Field(..., description="Region code")
    region_name: str = Field(..., description="Region name")
    rto_rate: float = Field(..., ge=0, le=100, description="RTO rate percentage")
    risk_level: RiskLevel = Field(..., description="Risk classification")
    total_orders: int = Field(..., ge=0, description="Total orders")
    risk_factors: List[str] = Field(default_factory=list, description="Risk factors")
    top_cities: List[CityData] = Field(default_factory=list, description="Top cities in region")
    population: Optional[int] = Field(None, ge=0, description="Region population")
    infrastructure_score: Optional[float] = Field(None, ge=0, le=10, description="Infrastructure score (1-10)")

class SeasonalImpact(BaseModel):
    """Seasonal impact data"""
    monsoon_spike: float = Field(..., description="Monsoon season RTO spike percentage")
    winter_delay_factor: float = Field(..., description="Winter delay multiplier")
    festival_season_improvement: float = Field(..., description="Festival season improvement percentage")
    summer_heat_impact: Optional[float] = Field(None, description="Summer heat impact percentage")

class UrbanRuralComparison(BaseModel):
    """Urban vs rural comparison"""
    metro_cities_avg: float = Field(..., ge=0, le=100, description="Metro cities average RTO rate")
    tier_2_cities_avg: float = Field(..., ge=0, le=100, description="Tier-2 cities average RTO rate")
    rural_areas_avg: float = Field(..., ge=0, le=100, description="Rural areas average RTO rate")
    suburban_avg: Optional[float] = Field(None, ge=0, le=100, description="Suburban areas average RTO rate")

class GeographicPatterns(BaseModel):
    """Geographic pattern analysis"""
    seasonal_impact: SeasonalImpact = Field(..., description="Seasonal impact analysis")
    urban_vs_rural: UrbanRuralComparison = Field(..., description="Urban vs rural comparison")
    connectivity_correlation: Optional[float] = Field(None, ge=-1, le=1, description="Correlation with connectivity")

class GeographicAnalyticsRequest(BaseModel):
    """Geographic analytics request"""
    level: Literal["state", "city", "pincode"] = Field("state", description="Analysis level")
    risk_threshold: float = Field(0.3, ge=0, le=1, description="Minimum risk threshold")
    include_patterns: bool = Field(True, description="Include pattern analysis")
    date_from: Optional[datetime] = Field(None, description="Start date filter")
    date_to: Optional[datetime] = Field(None, description="End date filter")

class GeographicAnalyticsResponse(BaseResponse):
    """Geographic analytics response"""
    geographic_analysis: Dict[str, Union[str, int]] = Field(..., description="Analysis metadata")
    regions: List[GeographicRegion] = Field(..., description="Region data")
    patterns: Optional[GeographicPatterns] = Field(None, description="Geographic patterns")

# ============================================================================
# LIVE MONITORING MODELS
# ============================================================================

class OrderAlert(BaseModel):
    """Order-specific alert"""
    type: Literal["WEATHER_ALERT", "COURIER_PERFORMANCE", "HIGH_RISK", "ADDRESS_ISSUE"] = Field(..., description="Alert type")
    message: str = Field(..., description="Alert message")
    severity: AlertType = Field(..., description="Alert severity")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Alert creation time")

class RecommendedAction(BaseModel):
    """Recommended action for live order"""
    action: str = Field(..., description="Action identifier")
    urgency: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = Field(..., description="Action urgency")
    deadline: Optional[datetime] = Field(None, description="Action deadline")
    estimated_effort_minutes: Optional[int] = Field(None, ge=0, description="Estimated effort in minutes")
    assigned_team: Optional[str] = Field(None, description="Assigned team/role")

class LiveOrder(BaseModel):
    """Live order monitoring data"""
    order_number: str = Field(..., description="Order number")
    created_at: datetime = Field(..., description="Order creation time")
    risk_assessment: PredictionResult = Field(..., description="Risk assessment")
    customer: Dict[str, str] = Field(..., description="Customer location info")
    order_value: Decimal = Field(..., ge=0, description="Order value")
    payment_mode: PaymentMode = Field(..., description="Payment mode")
    courier: str = Field(..., description="Courier name")
    status: OrderStatus = Field(..., description="Current order status")
    alerts: List[OrderAlert] = Field(default_factory=list, description="Active alerts")
    recommended_actions: List[RecommendedAction] = Field(default_factory=list, description="Recommended actions")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last update time")

class LiveOrdersSummary(BaseModel):
    """Live orders summary"""
    total_active_orders: int = Field(..., ge=0, description="Total active orders")
    critical_orders: int = Field(0, ge=0, description="Critical risk orders")
    pending_actions: int = Field(0, ge=0, description="Orders with pending actions")
    avg_risk_score: float = Field(0, ge=0, le=1, description="Average risk score")

class LiveOrdersRequest(BaseModel):
    """Live orders request"""
    risk_level: Optional[RiskLevel] = Field(None, description="Filter by risk level")
    courier: Optional[str] = Field(None, description="Filter by courier")
    limit: int = Field(50, ge=1, le=500, description="Number of orders to return")
    since: Optional[datetime] = Field(None, description="Return orders since timestamp")
    include_alerts: bool = Field(True, description="Include alerts in response")
    include_actions: bool = Field(True, description="Include recommended actions")

class LiveOrdersResponse(BaseResponse):
    """Live orders response"""
    live_orders: List[LiveOrder] = Field(..., description="List of live orders")
    summary: LiveOrdersSummary = Field(..., description="Summary statistics")
    next_update_available: Optional[datetime] = Field(None, description="Next update availability")

# ============================================================================
# ALERT MODELS
# ============================================================================

class AlertDetails(BaseModel):
    """Alert details"""
    affected_orders: Optional[int] = Field(None, ge=0, description="Number of affected orders")
    duration: Optional[str] = Field(None, description="Alert duration")
    impact_area: Optional[str] = Field(None, description="Impacted geographic area")
    suggested_actions: List[str] = Field(default_factory=list, description="Suggested actions")
    severity_score: Optional[float] = Field(None, ge=0, le=10, description="Severity score (1-10)")
    estimated_cost_impact: Optional[Decimal] = Field(None, ge=0, description="Estimated cost impact")

class SystemAlert(BaseModel):
    """System alert model"""
    id: str = Field(..., description="Unique alert ID")
    type: AlertType = Field(..., description="Alert type")
    category: Literal["RTO_SPIKE", "COURIER_PERFORMANCE", "SYSTEM_ERROR", "MODEL_DRIFT", "CAPACITY_ISSUE"] = Field(..., description="Alert category")
    message: str = Field(..., description="Alert message")
    details: AlertDetails = Field(..., description="Alert details")
    created_at: datetime = Field(..., description="Alert creation time")
    acknowledged: bool = Field(False, description="Whether alert is acknowledged")
    acknowledged_by: Optional[str] = Field(None, description="User who acknowledged")
    acknowledged_at: Optional[datetime] = Field(None, description="Acknowledgment timestamp")
    resolved: bool = Field(False, description="Whether alert is resolved")
    resolved_at: Optional[datetime] = Field(None, description="Resolution timestamp")
    auto_resolve: bool = Field(False, description="Whether alert auto-resolves")

class LiveAlertsResponse(BaseResponse):
    """Live alerts response"""
    alerts: List[SystemAlert] = Field(..., description="List of active alerts")
    total_alerts: int = Field(..., ge=0, description="Total number of alerts")
    critical_count: int = Field(0, ge=0, description="Number of critical alerts")
    unacknowledged_count: int = Field(0, ge=0, description="Number of unacknowledged alerts")

# ============================================================================
# AI INSIGHTS MODELS
# ============================================================================

class SupportingData(BaseModel):
    """Supporting data for insights"""
    current_performance: Optional[float] = Field(None, description="Current performance metric")
    benchmark_performance: Optional[float] = Field(None, description="Benchmark performance")
    confidence_interval: Optional[Dict[str, float]] = Field(None, description="Statistical confidence interval")
    sample_size: Optional[int] = Field(None, ge=0, description="Sample size for analysis")
    data_quality_score: Optional[float] = Field(None, ge=0, le=1, description="Data quality score")

class BusinessImpact(BaseModel):
    """Business impact metrics"""
    rto_reduction_percentage: Optional[float] = Field(None, description="Expected RTO reduction")
    monthly_savings: Optional[Decimal] = Field(None, ge=0, description="Monthly cost savings")
    annual_savings: Optional[Decimal] = Field(None, ge=0, description="Annual cost savings")
    implementation_complexity: Literal["LOW", "MEDIUM", "HIGH"] = Field(..., description="Implementation complexity")
    affected_orders: Optional[int] = Field(None, ge=0, description="Number of affected orders")
    customer_satisfaction_impact: Optional[float] = Field(None, description="Customer satisfaction impact")
    operational_efficiency_gain: Optional[float] = Field(None, description="Operational efficiency gain")

class ActionPlan(BaseModel):
    """Action plan item"""
    action: str = Field(..., description="Action description")
    timeline: str = Field(..., description="Timeline for completion")
    owner: Optional[str] = Field(None, description="Action owner")
    prerequisites: List[str] = Field(default_factory=list, description="Action prerequisites")
    success_metrics: List[str] = Field(default_factory=list, description="Success measurement metrics")

class MitigationStrategy(BaseModel):
    """Risk mitigation strategy"""
    strategy: str = Field(..., description="Mitigation strategy")
    cost: Decimal = Field(..., ge=0, description="Strategy cost")
    impact: str = Field(..., description="Expected impact")
    timeline: str = Field(..., description="Implementation timeline")
    risk_reduction: Optional[float] = Field(None, ge=0, le=100, description="Risk reduction percentage")

class AIInsight(BaseModel):
    """AI-generated business insight"""
    id: str = Field(..., description="Unique insight ID")
    category: Literal["COURIER_OPTIMIZATION", "SEASONAL_PATTERNS", "COST_REDUCTION", "CUSTOMER_BEHAVIOR", "OPERATIONAL_EFFICIENCY"] = Field(..., description="Insight category")
    priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Insight priority")
    confidence: float = Field(..., ge=0, le=1, description="AI confidence score")
    title: str = Field(..., max_length=200, description="Insight title")
    description: str = Field(..., max_length=2000, description="Detailed description")
    impact: BusinessImpact = Field(..., description="Business impact assessment")
    supporting_data: Optional[SupportingData] = Field(None, description="Supporting statistical data")
    recommended_actions: List[ActionPlan] = Field(default_factory=list, description="Recommended action plan")
    mitigation_strategies: List[MitigationStrategy] = Field(default_factory=list, description="Risk mitigation strategies")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Insight creation time")
    expires_at: Optional[datetime] = Field(None, description="Insight expiration time")
    tags: List[str] = Field(default_factory=list, description="Insight tags")

class InsightsMeta(BaseModel):
    """Insights metadata"""
    total_insights: int = Field(..., ge=0, description="Total number of insights")
    high_priority: int = Field(0, ge=0, description="High priority insights count")
    medium_priority: int = Field(0, ge=0, description="Medium priority insights count")
    low_priority: int = Field(0, ge=0, description="Low priority insights count")
    last_generated: datetime = Field(..., description="Last insights generation time")

class AIInsightsRequest(BaseModel):
    """AI insights request"""
    category: Optional[Literal["courier_optimization", "seasonal_patterns", "cost_reduction", "customer_behavior", "operational_efficiency", "all"]] = Field("all", description="Filter by category")
    time_horizon: Literal["short_term", "medium_term", "long_term"] = Field("medium_term", description="Time horizon for insights")
    min_confidence: float = Field(0.5, ge=0, le=1, description="Minimum confidence threshold")
    include_expired: bool = Field(False, description="Include expired insights")
    limit: int = Field(10, ge=1, le=100, description="Maximum insights to return")

class AIInsightsResponse(BaseResponse):
    """AI insights response"""
    insights: List[AIInsight] = Field(..., description="List of AI insights")
    meta: InsightsMeta = Field(..., description="Insights metadata")

# ============================================================================
# FORECASTING MODELS
# ============================================================================

class ConfidenceInterval(BaseModel):
    """Statistical confidence interval"""
    lower: float = Field(..., description="Lower bound")
    upper: float = Field(..., description="Upper bound")
    confidence_level: float = Field(0.95, ge=0, le=1, description="Confidence level (e.g., 0.95 for 95%)")

class ForecastMetric(BaseModel):
    """Individual forecast metric"""
    predicted: float = Field(..., description="Predicted value")
    confidence_interval: ConfidenceInterval = Field(..., description="Confidence interval")

class ForecastDataPoint(BaseModel):
    """Single forecast data point"""
    date: datetime = Field(..., description="Forecast date")
    rto_rate: ForecastMetric = Field(..., description="RTO rate forecast")
    order_volume: ForecastMetric = Field(..., description="Order volume forecast")
    cost_savings: ForecastMetric = Field(..., description="Cost savings forecast")
    uncertainty_score: Optional[float] = Field(None, ge=0, le=1, description="Forecast uncertainty")

class SeasonalFactor(BaseModel):
    """Seasonal factor affecting forecast"""
    factor: str = Field(..., description="Factor name")
    impact: float = Field(..., description="Impact value")
    confidence: float = Field(..., ge=0, le=1, description="Factor confidence")
    description: Optional[str] = Field(None, description="Factor description")

class ForecastTrends(BaseModel):
    """Forecast trend analysis"""
    rto_rate_trend: Literal["INCREASING", "DECREASING", "STABLE", "VOLATILE"] = Field(..., description="RTO rate trend")
    seasonal_factors: List[SeasonalFactor] = Field(default_factory=list, description="Seasonal factors")
    risk_factors: List[SeasonalFactor] = Field(default_factory=list, description="Risk factors")
    confidence_trend: Optional[Literal["IMPROVING", "DEGRADING", "STABLE"]] = Field(None, description="Model confidence trend")

class ForecastRequest(BaseModel):
    """Forecasting request"""
    horizon_days: int = Field(30, ge=1, le=90, description="Forecast horizon in days")
    include_confidence_intervals: bool = Field(True, description="Include confidence intervals")
    granularity: Literal["daily", "weekly", "monthly"] = Field("daily", description="Forecast granularity")
    include_trends: bool = Field(True, description="Include trend analysis")
    scenario: Optional[Literal["optimistic", "realistic", "pessimistic"]] = Field("realistic", description="Forecast scenario")

class ForecastInfo(BaseModel):
    """Forecast metadata"""
    horizon_days: int = Field(..., ge=1, description="Forecast horizon")
    generated_at: datetime = Field(..., description="Generation timestamp")
    model_version: str = Field(..., description="Forecasting model version")
    confidence_level: float = Field(..., ge=0, le=1, description="Overall confidence level")
    data_freshness_hours: Optional[int] = Field(None, ge=0, description="Data freshness in hours")

class ForecastResponse(BaseResponse):
    """Forecasting response"""
    forecast: ForecastInfo = Field(..., description="Forecast metadata")
    predictions: List[ForecastDataPoint] = Field(..., description="Forecast data points")
    trends: ForecastTrends = Field(..., description="Trend analysis")
    model_performance: Optional[ModelMetrics] = Field(None, description="Historical model performance")

# ============================================================================
# MODEL MANAGEMENT MODELS
# ============================================================================

class ModelFeature(BaseModel):
    """Model feature information"""
    name: str = Field(..., description="Feature name")
    importance: float = Field(..., ge=0, le=100, description="Feature importance percentage")
    type: Literal["categorical", "numerical", "binary", "text"] = Field(..., description="Feature type")
    description: Optional[str] = Field(None, description="Feature description")
    data_type: Optional[str] = Field(None, description="Data type")
    null_rate: Optional[float] = Field(None, ge=0, le=100, description="Null rate percentage")

class ModelPerformanceSegment(BaseModel):
    """Model performance by segment"""
    segment: str = Field(..., description="Segment name")
    accuracy: float = Field(..., ge=0, le=100, description="Segment accuracy")
    precision: float = Field(..., ge=0, le=100, description="Segment precision")
    recall: float = Field(..., ge=0, le=100, description="Segment recall")
    sample_count: int = Field(..., ge=0, description="Segment sample count")
    bias_score: Optional[float] = Field(None, ge=0, le=1, description="Bias score")

class ModelInfo(BaseModel):
    """Current model information"""
    version: str = Field(..., description="Model version")
    type: str = Field(..., description="Model type (e.g., 'XGBoost Ensemble')")
    accuracy: float = Field(..., ge=0, le=100, description="Overall accuracy")
    precision: float = Field(..., ge=0, le=100, description="Overall precision")
    recall: float = Field(..., ge=0, le=100, description="Overall recall")
    f1_score: float = Field(..., ge=0, le=100, description="F1 score")
    trained_at: datetime = Field(..., description="Training timestamp")
    training_samples: int = Field(..., ge=0, description="Number of training samples")
    validation_samples: int = Field(..., ge=0, description="Number of validation samples")
    feature_count: int = Field(..., ge=0, description="Number of features")
    training_duration_minutes: Optional[int] = Field(None, ge=0, description="Training duration")

class ModelInfoResponse(BaseResponse):
    """Model info response"""
    model: ModelInfo = Field(..., description="Model information")
    features: List[ModelFeature] = Field(..., description="Model features")
    performance_by_segment: List[ModelPerformanceSegment] = Field(..., description="Segment performance")
    drift_score: Optional[float] = Field(None, ge=0, le=1, description="Model drift score")
    last_evaluation: Optional[datetime] = Field(None, description="Last evaluation timestamp")

class TrainingConfig(BaseModel):
    """Model training configuration"""
    include_recent_days: int = Field(30, ge=1, le=365, description="Recent data days to include")
    validation_split: float = Field(0.2, ge=0.1, le=0.5, description="Validation split ratio")
    hyperparameter_tuning: bool = Field(True, description="Enable hyperparameter tuning")
    early_stopping: bool = Field(True, description="Enable early stopping")
    cross_validation_folds: int = Field(5, ge=3, le=10, description="Cross-validation folds")
    feature_selection: bool = Field(True, description="Enable automatic feature selection")
    ensemble_models: List[str] = Field(default_factory=lambda: ["xgboost", "lightgbm", "catboost"], description="Ensemble model types")

class RetrainRequest(BaseModel):
    """Model retrain request"""
    training_config: TrainingConfig = Field(default_factory=TrainingConfig, description="Training configuration")
    notification_webhook: Optional[str] = Field(None, description="Webhook URL for notifications")
    priority: Literal["LOW", "NORMAL", "HIGH"] = Field("NORMAL", description="Training job priority")
    schedule_for: Optional[datetime] = Field(None, description="Schedule training for specific time")

class RetrainResponse(BaseResponse):
    """Model retrain response"""
    job_id: str = Field(..., description="Training job ID")
    status: Literal["SCHEDULED", "STARTED", "RUNNING", "COMPLETED", "FAILED"] = Field(..., description="Job status")
    estimated_duration_minutes: int = Field(..., ge=0, description="Estimated duration")
    started_at: Optional[datetime] = Field(None, description="Job start time")
    webhook_url: Optional[str] = Field(None, description="Notification webhook")
    progress_percentage: float = Field(0, ge=0, le=100, description="Training progress")

# ============================================================================
# CONFIGURATION MODELS
# ============================================================================

class RiskThreshold(BaseModel):
    """Risk threshold configuration"""
    min: Optional[float] = Field(None, ge=0, le=1, description="Minimum threshold")
    max: Optional[float] = Field(None, ge=0, le=1, description="Maximum threshold")
    color: str = Field(..., regex=r"^#[0-9A-Fa-f]{6}$", description="Color hex code")
    actions: List[str] = Field(default_factory=list, description="Recommended actions")
    notification_level: Optional[AlertType] = Field(None, description="Notification level")

class RiskThresholdsConfig(BaseModel):
    """Risk thresholds configuration"""
    low: RiskThreshold = Field(..., description="Low risk threshold")
    medium: RiskThreshold = Field(..., description="Medium risk threshold")
    high: RiskThreshold = Field(..., description="High risk threshold")
    critical: RiskThreshold = Field(..., description="Critical risk threshold")
    
    @validator('medium', 'high', 'critical')
    def validate_threshold_order(cls, v, values, field):
        """Validate that thresholds are in ascending order"""
        if field.name == 'medium':
            low = values.get('low')
            if low and v.min and low.max and v.min <= low.max:
                raise ValueError('Medium threshold min must be greater than low threshold max')
        return v

class RiskThresholdsResponse(BaseResponse):
    """Risk thresholds response"""
    thresholds: RiskThresholdsConfig = Field(..., description="Risk thresholds configuration")
    last_updated: datetime = Field(..., description="Last update timestamp")
    updated_by: Optional[str] = Field(None, description="User who last updated")

# ============================================================================
# WEBHOOK MODELS
# ============================================================================

class WebhookRetryConfig(BaseModel):
    """Webhook retry configuration"""
    max_retries: int = Field(3, ge=0, le=10, description="Maximum retry attempts")
    backoff_seconds: int = Field(60, ge=1, le=3600, description="Backoff time between retries")
    exponential_backoff: bool = Field(True, description="Use exponential backoff")

class WebhookRequest(BaseModel):
    """Webhook registration request"""
    url: str = Field(..., regex=r"^https?://", description="Webhook URL")
    events: List[Literal["critical_risk_detected", "model_retrained", "system_alert", "performance_threshold_breach", "batch_completed"]] = Field(..., min_items=1, description="Event types to subscribe to")
    headers: Optional[Dict[str, str]] = Field(None, description="Custom headers")
    retry_config: WebhookRetryConfig = Field(default_factory=WebhookRetryConfig, description="Retry configuration")
    active: bool = Field(True, description="Whether webhook is active")
    description: Optional[str] = Field(None, max_length=200, description="Webhook description")

class WebhookResponse(BaseResponse):
    """Webhook registration response"""
    webhook_id: str = Field(..., description="Unique webhook ID")
    url: str = Field(..., description="Webhook URL")
    events: List[str] = Field(..., description="Subscribed events")
    secret_token: str = Field(..., description="Secret token for webhook verification")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_triggered: Optional[datetime] = Field(None, description="Last trigger timestamp")
    success_count: int = Field(0, ge=0, description="Successful delivery count")
    failure_count: int = Field(0, ge=0, description="Failed delivery count")

# ============================================================================
# UTILITY MODELS
# ============================================================================

class HealthCheck(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="Health status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    checks: Dict[str, bool] = Field(default_factory=dict, description="Individual component checks")

class PaginationRequest(BaseModel):
    """Pagination request parameters"""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(50, ge=1, le=1000, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")

class PaginationResponse(BaseModel):
    """Pagination response metadata"""
    page: int = Field(..., ge=1, description="Current page")
    limit: int = Field(..., ge=1, description="Items per page")
    total_items: int = Field(..., ge=0, description="Total items count")
    total_pages: int = Field(..., ge=0, description="Total pages")
    has_next: bool = Field(..., description="Has next page")
    has_prev: bool = Field(..., description="Has previous page")

class BulkOperationResult(BaseModel):
    """Bulk operation result"""
    total_items: int = Field(..., ge=0, description="Total items processed")
    successful_items: int = Field(..., ge=0, description="Successfully processed items")
    failed_items: int = Field(0, ge=0, description="Failed items")
    errors: List[Dict[str, Union[str, int]]] = Field(default_factory=list, description="Error details")
    processing_time_seconds: float = Field(..., ge=0, description="Processing time in seconds")

# ============================================================================
# EXPORT AND REPORTING MODELS
# ============================================================================

class ExportRequest(BaseModel):
    """Data export request"""
    export_type: Literal["predictions", "analytics", "courier_performance", "geographic_data"] = Field(..., description="Type of data to export")
    format: Literal["csv", "xlsx", "json", "pdf"] = Field("csv", description="Export format")
    date_from: Optional[datetime] = Field(None, description="Start date filter")
    date_to: Optional[datetime] = Field(None, description="End date filter")
    filters: Optional[Dict[str, Union[str, List[str]]]] = Field(None, description="Additional filters")
    include_metadata: bool = Field(True, description="Include metadata in export")
    compress: bool = Field(False, description="Compress export file")

class ExportResponse(BaseResponse):
    """Data export response"""
    export_id: str = Field(..., description="Export job ID")
    status: Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED"] = Field(..., description="Export status")
    download_url: Optional[str] = Field(None, description="Download URL when ready")
    file_size_bytes: Optional[int] = Field(None, ge=0, description="File size in bytes")
    expires_at: Optional[datetime] = Field(None, description="Download link expiration")
    record_count: Optional[int] = Field(None, ge=0, description="Number of records exported")

# ============================================================================
# FASTAPI CONFIGURATION AND VALIDATION
# ============================================================================

# Configure all models for FastAPI compatibility
def configure_model_config():
    """Configure model settings for FastAPI compatibility"""
    models = [
        SinglePredictionRequest, SinglePredictionResponse, BatchPredictionRequest, BatchPredictionResponse,
        SystemHealthResponse, SystemMetricsResponse, AnalyticsOverviewRequest, AnalyticsOverviewResponse,
        CourierAnalyticsResponse, GeographicAnalyticsRequest, GeographicAnalyticsResponse,
        LiveOrdersRequest, LiveOrdersResponse, LiveAlertsResponse, AIInsightsRequest, AIInsightsResponse,
        ForecastRequest, ForecastResponse, ModelInfoResponse, RetrainRequest, RetrainResponse,
        RiskThresholdsResponse, WebhookRequest, WebhookResponse, ExportRequest, ExportResponse
    ]
    
    for model in models:
        if hasattr(model, 'model_config'):
            # Update existing config
            config = model.model_config
            config.update({
                'str_strip_whitespace': True,
                'validate_assignment': True,
                'arbitrary_types_allowed': True,
                'json_encoders': {
                    datetime: lambda v: v.isoformat(),
                    Decimal: lambda v: float(v)
                }
            })
        else:
            # Add new config
            model.model_config = ConfigDict(
                str_strip_whitespace=True,
                validate_assignment=True,
                arbitrary_types_allowed=True,
                json_encoders={
                    datetime: lambda v: v.isoformat(),
                    Decimal: lambda v: float(v)
                }
            )

# Apply configuration
configure_model_config()

# ============================================================================
# EXAMPLE USAGE AND TESTING HELPERS
# ============================================================================

def create_sample_prediction_request() -> SinglePredictionRequest:
    """Create a sample prediction request for testing"""
    return SinglePredictionRequest(
        order_number="ORD-2025-SAMPLE-001",
        customer=CustomerInfo(
            phone="9876543210",
            address="123 Sample Street, Tech Park, Sector 15",
            city="GURGAON",
            state="HARYANA",
            pincode="122001"
        ),
        order_details=OrderDetails(
            value=Decimal('1299.50'),
            quantity=1,
            weight=Decimal('0.75'),
            payment_mode=PaymentMode.COD,
            cod_amount=Decimal('1299.50'),
            created_at=datetime.utcnow(),
            category="Electronics",
            is_high_value=True
        ),
        courier=CourierInfo(
            name="DELHIVERY",
            service_type="standard"
        ),
        customer_history=CustomerHistory(
            total_orders=3,
            successful_orders=2,
            rto_count=1,
            avg_order_value=Decimal('1150.00')
        )
    )

def create_sample_batch_request(count: int = 3) -> BatchPredictionRequest:
    """Create a sample batch prediction request"""
    orders = []
    for i in range(count):
        order = create_sample_prediction_request()
        order.order_number = f"ORD-2025-BATCH-{i+1:03d}"
        orders.append(order)
    
    return BatchPredictionRequest(
        orders=orders,
        options=BatchPredictionOptions(
            include_recommendations=True,
            include_similar_orders=True,
            risk_threshold=0.3
        )
    )

# Model validation helpers
def validate_prediction_request(request_data: dict) -> SinglePredictionRequest:
    """Validate and parse prediction request data"""
    try:
        return SinglePredictionRequest.model_validate(request_data)
    except Exception as e:
        raise ValueError(f"Invalid prediction request: {e}")

def validate_analytics_request(request_data: dict) -> AnalyticsOverviewRequest:
    """Validate and parse analytics request data"""
    try:
        return AnalyticsOverviewRequest.model_validate(request_data)
    except Exception as e:
        raise ValueError(f"Invalid analytics request: {e}")

# ============================================================================
# MODEL REGISTRY - For easy import in FastAPI apps
# ============================================================================

__all__ = [
    # Enums
    'PaymentMode', 'RiskLevel', 'CourierGrade', 'OrderStatus', 'AlertType', 'SystemStatus',
    
    # Core Models
    'SinglePredictionRequest', 'SinglePredictionResponse', 'BatchPredictionRequest', 'BatchPredictionResponse',
    'CustomerInfo', 'CustomerHistory', 'OrderDetails', 'CourierInfo',
    'PredictionResult', 'RiskFactor', 'RecommendationAction', 'SimilarOrder',
    
    # System Models
    'SystemHealthResponse', 'SystemMetricsResponse', 'ModelMetrics', 'PerformanceMetrics',
    
    # Analytics Models
    'AnalyticsOverviewRequest', 'AnalyticsOverviewResponse', 'AnalyticsSummary',
    'CourierAnalyticsResponse', 'CourierAnalytics', 'CourierPerformance',
    'GeographicAnalyticsRequest', 'GeographicAnalyticsResponse', 'GeographicRegion',
    
    # Live Monitoring
    'LiveOrdersRequest', 'LiveOrdersResponse', 'LiveOrder', 'OrderAlert',
    'LiveAlertsResponse', 'SystemAlert', 'AlertDetails',
    
    # AI & Forecasting
    'AIInsightsRequest', 'AIInsightsResponse', 'AIInsight', 'BusinessImpact',
    'ForecastRequest', 'ForecastResponse', 'ForecastDataPoint', 'ForecastTrends',
    
    # Configuration
    'RiskThresholdsResponse', 'RiskThreshold', 'WebhookRequest', 'WebhookResponse',
    
    # Utilities
    'BaseResponse', 'APIError', 'HealthCheck', 'PaginationRequest', 'PaginationResponse',
    'ExportRequest', 'ExportResponse', 'BulkOperationResult',
    
    # Helpers
    'create_sample_prediction_request', 'create_sample_batch_request',
    'validate_prediction_request', 'validate_analytics_request'
]