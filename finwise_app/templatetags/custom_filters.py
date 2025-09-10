from django import template

register = template.Library()

@register.filter
def lookup(dictionary, key):
    """Template filter to lookup dictionary values"""
    if isinstance(dictionary, dict):
        return dictionary.get(key, {})
    return None

@register.filter
def mul(value, arg):
    """Multiply filter for templates"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0
