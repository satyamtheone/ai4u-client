# RTO Prediction Intelligence API Specification

## Base URL
```
https://api.rto-intelligence.com/v1
```

## Authentication
All API requests require authentication using API keys in headers:
```
Authorization: Bearer YOUR_API_KEY
X-Client-ID: YOUR_CLIENT_ID
```

---

## 1. System Status & Health

### GET /system/status
Get real-time system health and status.

**Response:**
```json
{
  "status": "healthy",
  "model_status": "active",
  "uptime_percentage": 99.97,
  "circuit_breaker_state": "CLOSED",
  "memory_usage_mb": 114.41,
  "api_response_time_ms": 247,
  "predictions_today": 47892,
  "high_risk_orders": 12847,
  "last_model_update": "2025-07-22T15:30:00Z",
  "error_count_24h": 0,
  "throughput_per_minute": 850
}
```

### GET /system/metrics
Get detailed system performance metrics.

**Response:**
```json
{
  "timestamp": "2025-07-22T21:27:24Z",
  "performance_metrics": {
    "prediction_latency": {
      "avg_ms": 97.3,
      "p95_ms": 145.2,
      "p99_ms": 234.1
    },
    "accuracy_metrics": {
      "current_accuracy": 87.4,
      "precision": 42.40,
      "recall": 91.3,
      "f1_score": 57.8
    },
    "business_metrics": {
      "cost_savings_mtd": 4270000,
      "rto_rate_current": 26.8,
      "rto_rate_baseline": 35.2,
      "customer_satisfaction": 94.2
    }
  }
}
```

---

## 2. Prediction Engine

### POST /predictions/single
Predict RTO for a single order.

**Request:**
```json
{
  "order_number": "ORD-2025-789234",
  "customer": {
    "phone": "9876543210",
    "address": "123 Main St, Sector 15, Gurgaon, Haryana 122001",
    "city": "GURGAON",
    "state": "HARYANA",
    "pincode": "122001"
  },
  "order_details": {
    "value": 2847.50,
    "quantity": 2,
    "weight": 1.5,
    "payment_mode": "COD",
    "created_at": "2025-07-22T18:45:00Z"
  },
  "courier": {
    "name": "AMAZON",
    "service_type": "standard"
  },
  "customer_history": {
    "total_orders": 5,
    "successful_orders": 3,
    "rto_count": 2,
    "avg_order_value": 1250.0
  }
}
```

**Response:**
```json
{
  "order_number": "ORD-2025-789234",
  "prediction": {
    "rto_probability": 0.942,
    "risk_level": "CRITICAL",
    "confidence_score": 0.89
  },
  "risk_factors": [
    {
      "factor": "payment_mode",
      "impact": 0.776,
      "description": "COD payment increases RTO risk"
    },
    {
      "factor": "geographic_risk",
      "impact": 0.673,
      "description": "High-risk pincode area"
    },
    {
      "factor": "courier_performance",
      "impact": 0.528,
      "description": "Courier has 68.2% success rate in this area"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH",
      "action": "customer_verification_call",
      "description": "Call customer within 30 minutes to verify address and availability",
      "expected_impact": "25% risk reduction"
    },
    {
      "priority": "HIGH",
      "action": "courier_upgrade",
      "description": "Switch to DTDC Standard (96.8% success rate)",
      "expected_impact": "35% risk reduction"
    },
    {
      "priority": "MEDIUM",
      "action": "prepaid_incentive",
      "description": "Offer 15% discount for prepaid payment",
      "expected_impact": "60% risk reduction"
    }
  ],
  "similar_orders": [
    {
      "similarity_score": 0.94,
      "order_number": "ORD-2025-789100",
      "outcome": "RTO",
      "courier": "AMAZON",
      "city": "GURGAON"
    }
  ],
  "timestamp": "2025-07-22T21:27:24Z",
  "processing_time_ms": 89
}
```

### POST /predictions/batch
Predict RTO for multiple orders in batch.

**Request:**
```json
{
  "orders": [
    {
      "order_number": "ORD-2025-789234",
      // ... same structure as single prediction
    },
    {
      "order_number": "ORD-2025-789235",
      // ... additional orders
    }
  ],
  "options": {
    "include_recommendations": true,
    "include_similar_orders": false,
    "risk_threshold": 0.5
  }
}
```

**Response:**
```json
{
  "batch_id": "batch-2025-07-22-001",
  "total_orders": 1000,
  "processed_orders": 1000,
  "failed_orders": 0,
  "processing_time_ms": 2347,
  "summary": {
    "high_risk_count": 342,
    "medium_risk_count": 189,
    "low_risk_count": 469,
    "avg_risk_score": 0.315
  },
  "predictions": [
    {
      "order_number": "ORD-2025-789234",
      "rto_probability": 0.942,
      "risk_level": "CRITICAL",
      // ... abbreviated response
    }
  ]
}
```

---

## 3. Analytics & Reporting

### GET /analytics/overview
Get dashboard overview metrics.

**Query Parameters:**
- `date_from`: ISO date (default: 30 days ago)
- `date_to`: ISO date (default: today)
- `courier_filter`: Optional courier name filter
- `risk_level`: Filter by risk level (low/medium/high/critical)

**Response:**
```json
{
  "period": {
    "date_from": "2025-06-22",
    "date_to": "2025-07-22"
  },
  "summary": {
    "total_predictions": 47892,
    "accuracy": 87.4,
    "rto_rate_predicted": 26.8,
    "rto_rate_actual": 24.3,
    "cost_savings": 4270000,
    "roi_percentage": 340
  },
  "risk_distribution": {
    "critical": 3247,
    "high": 8934,
    "medium": 12456,
    "low": 23255
  },
  "trends": {
    "daily_predictions": [
      {"date": "2025-07-15", "count": 1534, "accuracy": 86.2},
      {"date": "2025-07-16", "count": 1678, "accuracy": 87.1}
    ],
    "weekly_rto_rates": [
      {"week": "2025-W29", "rate": 28.4},
      {"week": "2025-W30", "rate": 26.8}
    ]
  }
}
```

### GET /analytics/couriers
Get courier performance analytics.

**Response:**
```json
{
  "couriers": [
    {
      "name": "DTDC Standard",
      "performance": {
        "success_rate": 96.8,
        "total_orders": 1200,
        "rto_orders": 38,
        "avg_delivery_time_days": 2.1,
        "avg_order_value": 847.50,
        "grade": "A+",
        "trend": "+2.1%"
      },
      "geographic_performance": [
        {
          "state": "Maharashtra",
          "success_rate": 98.2,
          "orders": 450
        },
        {
          "state": "Karnataka",
          "success_rate": 95.7,
          "orders": 380
        }
      ],
      "recommendations": [
        "Increase volume allocation",
        "Expand to more pin codes"
      ]
    }
  ],
  "industry_benchmarks": {
    "avg_success_rate": 76.3,
    "top_quartile": 89.2,
    "bottom_quartile": 65.4
  }
}
```

### GET /analytics/geography
Get geographic risk analysis.

**Query Parameters:**
- `level`: "state" | "city" | "pincode" (default: "state")
- `risk_threshold`: Minimum risk threshold (default: 0.3)

**Response:**
```json
{
  "geographic_analysis": {
    "level": "state",
    "total_regions": 29,
    "high_risk_regions": 8
  },
  "regions": [
    {
      "region_code": "MH",
      "region_name": "Maharashtra",
      "rto_rate": 8.2,
      "risk_level": "LOW",
      "total_orders": 15420,
      "risk_factors": [
        "Urban concentration",
        "Good infrastructure",
        "High prepaid adoption"
      ],
      "top_cities": [
        {
          "city": "Mumbai",
          "rto_rate": 4.7,
          "orders": 8940
        }
      ]
    },
    {
      "region_code": "JK",
      "region_name": "Jammu & Kashmir", 
      "rto_rate": 42.3,
      "risk_level": "CRITICAL",
      "total_orders": 1890,
      "risk_factors": [
        "Remote locations",
        "Weather disruptions",
        "Limited courier access",
        "Infrastructure challenges"
      ]
    }
  ],
  "patterns": {
    "seasonal_impact": {
      "monsoon_spike": 23.4,
      "winter_delay_factor": 1.8,
      "festival_season_improvement": -12.7
    },
    "urban_vs_rural": {
      "metro_cities_avg": 7.3,
      "tier_2_cities_avg": 18.9,
      "rural_areas_avg": 34.7
    }
  }
}
```

---

## 4. Live Monitoring

### GET /live/orders
Get real-time order monitoring.

**Query Parameters:**
- `risk_level`: Filter by risk (critical/high/medium/low)
- `courier`: Filter by courier name
- `limit`: Number of orders (default: 50, max: 500)
- `since`: ISO timestamp for incremental updates

**Response:**
```json
{
  "timestamp": "2025-07-22T21:27:24Z",
  "live_orders": [
    {
      "order_number": "ORD-2025-789234",
      "created_at": "2025-07-22T21:15:00Z",
      "risk_assessment": {
        "probability": 0.942,
        "level": "CRITICAL",
        "confidence": 0.89
      },
      "customer": {
        "city": "Srinagar",
        "state": "J&K",
        "pincode": "191001"
      },
      "order_value": 2847.50,
      "payment_mode": "COD",
      "courier": "AMAZON",
      "status": "PLACED",
      "alerts": [
        {
          "type": "WEATHER_ALERT",
          "message": "Heavy snowfall expected in delivery area"
        },
        {
          "type": "COURIER_PERFORMANCE",
          "message": "Courier performance below threshold in this area"
        }
      ],
      "recommended_actions": [
        {
          "action": "IMMEDIATE_CUSTOMER_CALL",
          "urgency": "HIGH",
          "deadline": "2025-07-22T21:45:00Z"
        }
      ]
    }
  ],
  "summary": {
    "total_active_orders": 1247,
    "critical_orders": 89,
    "pending_actions": 23
  }
}
```

### GET /live/alerts
Get real-time system alerts.

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "CRITICAL",
      "category": "RTO_SPIKE",
      "message": "RTO rate spike: +45% in Zone North-East",
      "details": {
        "affected_orders": 2847,
        "duration": "2h 15m",
        "impact_area": "North-East Zone",
        "suggested_actions": [
          "Investigate courier performance",
          "Check weather conditions",
          "Review recent address changes"
        ]
      },
      "created_at": "2025-07-22T19:12:00Z",
      "acknowledged": false
    },
    {
      "id": "alert-002",
      "type": "WARNING",
      "category": "COURIER_PERFORMANCE", 
      "message": "Amazon Logistics success rate dropped to 68.2%",
      "details": {
        "courier": "AMAZON",
        "current_rate": 68.2,
        "threshold": 75.0,
        "duration": "3 days",
        "affected_regions": ["Delhi NCR", "UP East"]
      },
      "created_at": "2025-07-22T18:30:00Z",
      "acknowledged": true
    }
  ]
}
```

---

## 5. AI Insights & Recommendations

### GET /ai/insights
Get AI-generated business insights.

**Query Parameters:**
- `category`: "courier_optimization" | "seasonal_patterns" | "cost_reduction" | "all"
- `time_horizon`: "short_term" | "medium_term" | "long_term"

**Response:**
```json
{
  "insights": [
    {
      "id": "insight-001",
      "category": "COURIER_OPTIMIZATION",
      "priority": "HIGH",
      "confidence": 0.92,
      "title": "Smart Courier Routing Recommendation",
      "description": "AI detected that switching 2,847 high-risk orders from Amazon to DTDC could reduce RTO by 23% and save ₹24.7L monthly.",
      "impact": {
        "rto_reduction_percentage": 23.0,
        "monthly_savings": 2470000,
        "implementation_complexity": "LOW",
        "affected_orders": 2847
      },
      "supporting_data": {
        "current_amazon_success": 68.2,
        "dtdc_success_rate": 96.8,
        "cost_difference": 45.0,
        "roi_timeline": "30 days"
      },
      "recommended_actions": [
        {
          "action": "Pilot test with 500 orders",
          "timeline": "1 week"
        },
        {
          "action": "Full rollout if pilot successful",
          "timeline": "2 weeks"
        }
      ],
      "created_at": "2025-07-22T20:00:00Z"
    },
    {
      "id": "insight-002", 
      "category": "SEASONAL_PATTERNS",
      "priority": "MEDIUM",
      "confidence": 0.87,
      "title": "Monsoon Impact Prediction",
      "description": "ML models predict 43% RTO spike during monsoon (July-September) in Northern states.",
      "impact": {
        "rto_spike_percentage": 43.0,
        "affected_regions": ["Punjab", "Haryana", "UP", "Uttarakhand"],
        "peak_months": ["July", "August", "September"],
        "estimated_additional_cost": 8900000
      },
      "mitigation_strategies": [
        {
          "strategy": "Build inventory buffers in regional hubs",
          "cost": 2500000,
          "impact": "35% spike reduction"
        },
        {
          "strategy": "Adjust courier mix 2 weeks prior",
          "cost": 150000,
          "impact": "20% spike reduction"
        }
      ]
    }
  ],
  "meta": {
    "total_insights": 12,
    "high_priority": 3,
    "medium_priority": 6,
    "low_priority": 3
  }
}
```

### GET /ai/forecasting
Get AI-powered forecasting.

**Query Parameters:**
- `horizon_days`: Number of days to forecast (default: 30, max: 90)
- `include_confidence_intervals`: boolean (default: true)

**Response:**
```json
{
  "forecast": {
    "horizon_days": 30,
    "generated_at": "2025-07-22T21:27:24Z",
    "model_version": "v2.1.3",
    "confidence_level": 0.87
  },
  "predictions": [
    {
      "date": "2025-07-23",
      "rto_rate": {
        "predicted": 24.7,
        "confidence_interval": {
          "lower": 22.1,
          "upper": 27.3
        }
      },
      "order_volume": {
        "predicted": 1650,
        "confidence_interval": {
          "lower": 1420,
          "upper": 1880
        }
      },
      "cost_savings": {
        "predicted": 145000,
        "confidence_interval": {
          "lower": 125000,
          "upper": 165000
        }
      }
    }
  ],
  "trends": {
    "rto_rate_trend": "DECREASING",
    "seasonal_factors": [
      {
        "factor": "post_monsoon_improvement",
        "impact": -8.4,
        "confidence": 0.91
      }
    ],
    "risk_factors": [
      {
        "factor": "festival_season_approaching",
        "impact": 5.2,
        "confidence": 0.78
      }
    ]
  }
}
```

---

## 6. Model Management

### GET /model/info
Get current model information.

**Response:**
```json
{
  "model": {
    "version": "v2.1.3",
    "type": "XGBoost Ensemble",
    "accuracy": 87.4,
    "precision": 42.40,
    "recall": 91.3,
    "f1_score": 57.8,
    "trained_at": "2025-07-22T15:30:00Z",
    "training_samples": 2400000,
    "feature_count": 42
  },
  "features": [
    {
      "name": "payment_mode_encoded",
      "importance": 84.7,
      "type": "categorical"
    },
    {
      "name": "geographic_risk_score",
      "importance": 67.3,
      "type": "numerical"
    },
    {
      "name": "courier_performance_score",
      "importance": 52.8,
      "type": "numerical"
    }
  ],
  "performance_by_segment": [
    {
      "segment": "high_value_orders",
      "accuracy": 89.2,
      "sample_count": 450000
    },
    {
      "segment": "cod_orders",
      "accuracy": 85.1,
      "sample_count": 1800000
    }
  ]
}
```

### POST /model/retrain
Trigger model retraining (Admin only).

**Request:**
```json
{
  "training_config": {
    "include_recent_days": 30,
    "validation_split": 0.2,
    "hyperparameter_tuning": true
  },
  "notification_webhook": "https://your-app.com/webhook/model-retrain"
}
```

**Response:**
```json
{
  "job_id": "retrain-job-001",
  "status": "STARTED",
  "estimated_duration_minutes": 45,
  "started_at": "2025-07-22T21:30:00Z",
  "webhook_url": "https://your-app.com/webhook/model-retrain"
}
```

---

## 7. Configuration & Settings

### GET /config/risk-thresholds
Get risk classification thresholds.

**Response:**
```json
{
  "thresholds": {
    "low": {
      "max": 0.25,
      "color": "#10b981",
      "actions": []
    },
    "medium": {
      "min": 0.25,
      "max": 0.50,
      "color": "#f59e0b",
      "actions": ["address_verification"]
    },
    "high": {
      "min": 0.50,
      "max": 0.75,
      "color": "#ef4444", 
      "actions": ["customer_call", "courier_upgrade"]
    },
    "critical": {
      "min": 0.75,
      "color": "#dc2626",
      "actions": ["immediate_customer_call", "prepaid_incentive", "premium_courier"]
    }
  }
}
```

### PUT /config/risk-thresholds
Update risk thresholds (Admin only).

---

## 8. Webhooks & Integrations

### POST /webhooks/register
Register a webhook for real-time notifications.

**Request:**
```json
{
  "url": "https://your-app.com/webhook/rto-alerts",
  "events": [
    "critical_risk_detected",
    "model_retrained",
    "system_alert",
    "performance_threshold_breach"
  ],
  "headers": {
    "Authorization": "Bearer your-webhook-token"
  },
  "retry_config": {
    "max_retries": 3,
    "backoff_seconds": 60
  }
}
```

---

## Error Responses

All endpoints return structured error responses:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Order number is required",
    "details": {
      "field": "order_number",
      "provided": null,
      "expected": "string"
    },
    "request_id": "req-123456789"
  }
}
```

**Common Error Codes:**
- `INVALID_REQUEST` (400)
- `UNAUTHORIZED` (401) 
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

---

## Rate Limits

- **Standard Plan**: 1000 requests/hour
- **Premium Plan**: 10,000 requests/hour  
- **Enterprise Plan**: Unlimited

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1690920000
```

---

## SDKs & Libraries

Available in:
- Python: `pip install rto-intelligence-sdk`
- Node.js: `npm install rto-intelligence-sdk`
- Java: Maven/Gradle dependencies
- PHP: Composer package

## Support

- **Documentation**: https://docs.rto-intelligence.com
- **Support**: support@rto-intelligence.com
- **Status Page**: https://status.rto-intelligence.com