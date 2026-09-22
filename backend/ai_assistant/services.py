from ai_assistant.models import AIConfiguration


def get_ai_configuration():
    configuration = AIConfiguration.objects.first()

    if configuration is None:
        configuration = AIConfiguration.objects.create()

    return configuration