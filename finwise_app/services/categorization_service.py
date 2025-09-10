"""
Transaction categorization service for FR04
Automatically classifies transactions into categories within 3 seconds
"""
from typing import List, Dict, Optional
import time
from django.db import transaction as db_transaction
from django.utils import timezone
from django.core.cache import cache

from ..models import Transaction, Category


class TransactionCategorizationService:
    """Service to automatically categorize transactions"""
    
    CACHE_KEY_CATEGORIES = "active_categories_with_keywords"
    CACHE_TIMEOUT = 300  # 5 minutes
    
    def __init__(self):
        self._categories_cache: Optional[List[Dict]] = None
    
    def get_active_categories(self) -> List[Dict]:
        """Get active categories with their keywords, cached for performance"""
        if self._categories_cache is not None:
            return self._categories_cache
            
        # Try cache first
        cached_categories = cache.get(self.CACHE_KEY_CATEGORIES)
        if cached_categories:
            self._categories_cache = cached_categories
            return cached_categories
        
        # Build categories list with keywords
        categories = []
        for category in Category.objects.filter(is_active=True).prefetch_related():
            keywords = category.get_keywords_list()
            if keywords:  # Only include categories with keywords
                categories.append({
                    'id': category.id,
                    'name': category.name,
                    'keywords': keywords
                })
        
        # Cache the result
        cache.set(self.CACHE_KEY_CATEGORIES, categories, self.CACHE_TIMEOUT)
        self._categories_cache = categories
        return categories
    
    def categorize_transaction(self, transaction: Transaction) -> bool:
        """
        Categorize a single transaction within 3 seconds (FR04 requirement)
        Returns True if categorized successfully
        """
        start_time = time.time()
        
        if transaction.is_categorized:
            return True
        
        # Get transaction text for matching
        text_to_match = f"{transaction.name} {transaction.memo}".lower()
        
        # Get active categories
        categories = self.get_active_categories()
        
        # Find matching category
        matched_category_id = None
        for category_data in categories:
            for keyword in category_data['keywords']:
                if keyword in text_to_match:
                    matched_category_id = category_data['id']
                    break
            if matched_category_id:
                break
        
        # Apply categorization
        if matched_category_id:
            category = Category.objects.get(id=matched_category_id)
        else:
            # Create/get "Uncategorized" category
            category, _ = Category.objects.get_or_create(
                name="Uncategorized",
                defaults={
                    "description": "Transactions that couldn't be automatically categorized",
                    "color": "#9CA3AF",
                    "keywords": ""
                }
            )
        
        # Update transaction
        transaction.category = category
        transaction.is_categorized = True
        transaction.categorized_at = timezone.now()
        transaction.save()
        
        # Check timing requirement
        elapsed_time = time.time() - start_time
        if elapsed_time > 3.0:
            # Log performance issue but don't fail
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Transaction categorization took {elapsed_time:.2f}s (>3s requirement)")
        
        return True
    
    def categorize_bulk_transactions(self, transactions: List[Transaction]) -> Dict[str, int]:
        """
        Categorize multiple transactions efficiently
        Returns stats about categorization
        """
        start_time = time.time()
        stats = {
            'total': len(transactions),
            'categorized': 0,
            'skipped': 0,
            'errors': 0
        }
        
        # Filter uncategorized transactions
        uncategorized_txns = [txn for txn in transactions if not txn.is_categorized]
        
        if not uncategorized_txns:
            stats['skipped'] = stats['total']
            return stats
        
        # Get active categories once
        categories = self.get_active_categories()
        
        # Get/create uncategorized category
        uncategorized_category, _ = Category.objects.get_or_create(
            name="Uncategorized",
            defaults={
                "description": "Transactions that couldn't be automatically categorized",
                "color": "#9CA3AF",
                "keywords": ""
            }
        )
        
        # Categorize in bulk
        with db_transaction.atomic():
            for txn in uncategorized_txns:
                try:
                    text_to_match = f"{txn.name} {txn.memo}".lower()
                    
                    # Find matching category
                    matched_category_id = None
                    for category_data in categories:
                        for keyword in category_data['keywords']:
                            if keyword in text_to_match:
                                matched_category_id = category_data['id']
                                break
                        if matched_category_id:
                            break
                    
                    # Apply category
                    if matched_category_id:
                        txn.category_id = matched_category_id
                    else:
                        txn.category = uncategorized_category
                    
                    txn.is_categorized = True
                    txn.categorized_at = timezone.now()
                    stats['categorized'] += 1
                    
                except Exception as e:
                    stats['errors'] += 1
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error categorizing transaction {txn.id}: {e}")
            
            # Bulk update
            Transaction.objects.bulk_update(
                uncategorized_txns,
                ['category', 'category_id', 'is_categorized', 'categorized_at']
            )
        
        elapsed_time = time.time() - start_time
        avg_time_per_txn = elapsed_time / len(uncategorized_txns) if uncategorized_txns else 0
        
        # Log performance
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Bulk categorized {stats['categorized']} transactions in {elapsed_time:.2f}s "
                   f"(avg {avg_time_per_txn:.3f}s per transaction)")
        
        return stats
    
    def clear_cache(self):
        """Clear the categories cache"""
        cache.delete(self.CACHE_KEY_CATEGORIES)
        self._categories_cache = None


def create_default_categories():
    """Create default spending categories with keywords"""
    default_categories = [
        {
            "name": "Groceries",
            "description": "Food and grocery shopping",
            "keywords": "supermarket,grocery,food,safeway,kroger,walmart,costco,trader joe,whole foods",
            "color": "#10B981"
        },
        {
            "name": "Gas & Transportation",
            "description": "Fuel, public transit, rideshare",
            "keywords": "gas,fuel,shell,exxon,chevron,uber,lyft,taxi,metro,transit,parking",
            "color": "#F59E0B"
        },
        {
            "name": "Restaurants",
            "description": "Dining out and food delivery",
            "keywords": "restaurant,cafe,coffee,pizza,mcdonald,starbucks,doordash,grubhub,uber eats",
            "color": "#EF4444"
        },
        {
            "name": "Shopping",
            "description": "Retail purchases and online shopping",
            "keywords": "amazon,target,best buy,mall,store,shopping,retail,clothes,amazon.com",
            "color": "#8B5CF6"
        },
        {
            "name": "Bills & Utilities",
            "description": "Monthly bills and utility payments",
            "keywords": "electric,gas company,water,internet,phone,cable,utility,bill,payment",
            "color": "#6B7280"
        },
        {
            "name": "Entertainment",
            "description": "Movies, streaming, games, events",
            "keywords": "netflix,spotify,movie,theater,game,entertainment,steam,xbox,playstation",
            "color": "#EC4899"
        },
        {
            "name": "Healthcare",
            "description": "Medical expenses and pharmacy",
            "keywords": "pharmacy,doctor,medical,hospital,health,cvs,walgreens,clinic",
            "color": "#14B8A6"
        },
        {
            "name": "Income",
            "description": "Salary, wages, and other income",
            "keywords": "salary,payroll,deposit,income,wage,bonus,refund",
            "color": "#059669"
        }
    ]
    
    created_count = 0
    for cat_data in default_categories:
        category, created = Category.objects.get_or_create(
            name=cat_data["name"],
            defaults=cat_data
        )
        if created:
            created_count += 1
    
    return created_count
