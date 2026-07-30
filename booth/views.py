import base64
import uuid

from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Photo


def index(request):
    """Render the main photo booth page."""
    photos = Photo.objects.all()[:12]
    return render(request, "booth/index.html", {"photos": photos})


@csrf_exempt  # simplified for local dev; see notes.md for a CSRF-safe version
@require_POST
def save_photo(request):
    """
    Receive a base64-encoded PNG/JPEG captured from the browser <canvas>,
    decode it, and store it permanently as a Photo record + media file.
    """
    import json

    data_url = request.POST.get("image_data")
    filter_used = request.POST.get("filter_used", "original")

    if not data_url:
        # Support raw JSON body too (fetch with Content-Type: application/json)
        try:
            payload = json.loads(request.body.decode("utf-8"))
            data_url = payload.get("image_data")
            filter_used = payload.get("filter_used", "original")
        except (ValueError, UnicodeDecodeError):
            return JsonResponse({"ok": False, "error": "No image data received."}, status=400)

    if not data_url or "," not in data_url:
        return JsonResponse({"ok": False, "error": "Invalid image data."}, status=400)

    header, encoded = data_url.split(",", 1)
    ext = "png" if "png" in header else "jpg"
    try:
        decoded = base64.b64decode(encoded)
    except Exception:
        return JsonResponse({"ok": False, "error": "Could not decode image."}, status=400)

    filename = f"{uuid.uuid4().hex}.{ext}"
    photo = Photo(filter_used=filter_used)
    photo.image.save(filename, ContentFile(decoded), save=True)

    return JsonResponse(
        {
            "ok": True,
            "id": photo.id,
            "url": photo.image.url,
            "filter_used": photo.filter_used,
            "created_at": photo.created_at.strftime("%d %b %Y, %H:%M"),
        }
    )


def gallery_json(request):
    """Return the latest photos as JSON (used to refresh the gallery without reload)."""
    photos = Photo.objects.all()[:24]
    data = [
        {
            "id": p.id,
            "url": p.image.url,
            "filter_used": p.filter_used,
            "created_at": p.created_at.strftime("%d %b %Y, %H:%M"),
        }
        for p in photos
    ]
    return JsonResponse({"photos": data})
