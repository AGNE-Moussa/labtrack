from django.contrib import admin

# Register your models here.

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "status", "start_date", "created_at"]
    list_filter = ["status", "owner"]
    search_fields = ["title"]