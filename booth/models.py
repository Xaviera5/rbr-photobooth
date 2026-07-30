from django.db import models


class Photo(models.Model):
    FILTER_CHOICES = [
        ("original", "Original"),
        ("rbr", "RBR Mode"),
        ("mono", "Mono"),
        ("speed", "Speed"),
    ]

    image = models.ImageField(upload_to="captures/")
    filter_used = models.CharField(
        max_length=20, choices=FILTER_CHOICES, default="original"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Photo #{self.pk} ({self.filter_used}) - {self.created_at:%Y-%m-%d %H:%M}"
