import { FaqCategory, CATEGORY_CONFIGS } from '../constants/faq.constants';

export function getCategoryConfig(categoryId: string): Omit<FaqCategory, 'id'> {
  return (
    CATEGORY_CONFIGS[categoryId.toLowerCase()] || {
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: 'help_outline',
      description: 'Questions about ' + categoryId,
    }
  );
}
