from django.core.management.base import BaseCommand
from finwise_app.models import Category


class Command(BaseCommand):
    help = 'Create default spending categories'

    def handle(self, *args, **options):
        """Create default categories for the financial app"""
        
        default_categories = [
            {
                'name': 'Food & Dining',
                'description': 'Restaurants, groceries, food delivery',
                'keywords': 'restaurant,food,grocery,dining,pizza,mcdonald,starbucks,uber eats,doordash,grubhub,safeway,walmart,costco,whole foods',
                'color': '#EF4444'
            },
            {
                'name': 'Transportation',
                'description': 'Gas, car payments, public transit, rideshare',
                'keywords': 'gas,fuel,uber,lyft,taxi,bus,train,parking,car payment,auto,vehicle,chevron,shell,exxon',
                'color': '#3B82F6'
            },
            {
                'name': 'Shopping',
                'description': 'Clothing, electronics, general retail',
                'keywords': 'amazon,target,best buy,clothing,shopping,retail,electronics,clothing,shoes,apparel',
                'color': '#8B5CF6'
            },
            {
                'name': 'Bills & Utilities',
                'description': 'Rent, electricity, water, phone, internet',
                'keywords': 'rent,utilities,electric,water,phone,internet,cable,insurance,mortgage,utility,bill',
                'color': '#F59E0B'
            },
            {
                'name': 'Entertainment',
                'description': 'Movies, games, streaming services, hobbies',
                'keywords': 'netflix,spotify,movie,theater,gaming,entertainment,hobby,subscription,steam,apple music',
                'color': '#10B981'
            },
            {
                'name': 'Healthcare',
                'description': 'Medical expenses, pharmacy, insurance',
                'keywords': 'medical,doctor,hospital,pharmacy,health,dental,insurance,medicine,prescription',
                'color': '#F43F5E'
            },
            {
                'name': 'Education',
                'description': 'Tuition, books, courses, training',
                'keywords': 'school,education,tuition,books,course,training,university,college,learning',
                'color': '#06B6D4'
            },
            {
                'name': 'Travel',
                'description': 'Flights, hotels, vacation expenses',
                'keywords': 'flight,hotel,travel,vacation,airbnb,airline,booking,expedia,trip',
                'color': '#84CC16'
            },
            {
                'name': 'Income',
                'description': 'Salary, wages, freelance income',
                'keywords': 'salary,payroll,income,wages,freelance,bonus,commission,payment',
                'color': '#22C55E'
            },
            {
                'name': 'Uncategorized',
                'description': 'Transactions that need manual categorization',
                'keywords': '',
                'color': '#6B7280'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for cat_data in default_categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'keywords': cat_data['keywords'],
                    'color': cat_data['color'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                # Update existing category with new data
                category.description = cat_data['description']
                category.keywords = cat_data['keywords']
                category.color = cat_data['color']
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated category: {category.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nSummary: {created_count} categories created, {updated_count} updated')
        )
