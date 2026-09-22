from django.db import models


class AIConfiguration(models.Model):
    class RiskLevel(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    enabled = models.BooleanField(default=True)

    analysis_enabled = models.BooleanField(default=True)

    suggestions_enabled = models.BooleanField(default=False)

    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM,
    )

    confidence_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=60.00,
    )

    status_message = models.CharField(
        max_length=255,
        default=(
            "AI analysis is available for simulated market analysis."
        ),
    )

    updated_at = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "AI Configuration"

    class Meta:
        verbose_name = "AI Configuration"
        verbose_name_plural = "AI Configuration"