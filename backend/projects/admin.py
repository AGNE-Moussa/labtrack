from django.contrib import admin

# Register your models here.

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "start_date", "created_at"]
    list_filter = ["status"]
    search_fields = ["title"]