from django.urls import path

from . import views

app_name = "booth"

urlpatterns = [
    path("", views.index, name="index"),
    path("api/save-photo/", views.save_photo, name="save_photo"),
    path("api/gallery/", views.gallery_json, name="gallery_json"),
]
