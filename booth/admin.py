from django.contrib import admin

from .models import Photo


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "filter_used", "created_at")
    list_filter = ("filter_used",)
    ordering = ("-created_at",)
