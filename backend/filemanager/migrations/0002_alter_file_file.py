# Generated by Django 5.1.4 on 2024-12-27 05:08

import filemanager.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('filemanager', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='file',
            field=models.FileField(upload_to=filemanager.models.user_directory_path),
        ),
    ]
