# Generated by Django 5.1.4 on 2024-12-25 12:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_totp_secret'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='username',
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('ADMIN', 'Admin'), ('GUEST', 'Guest')], default='GUEST', max_length=10),
        ),
    ]
