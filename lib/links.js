export function whatsappLink(settings, locale, product) {
  const destination = settings.whatsappUrl;
  const message = locale === 'ru'
    ? `Здравствуйте, SunExportCo! Меня интересует ${product || 'свежая продукция из Ирана'}. Объем: … Пункт назначения: … Уточните, пожалуйста, наличие, характеристики и цену.`
    : `Hello SunExportCo, I’m interested in ${product || 'fresh produce from Iran'}. Quantity: … Destination: … Please advise availability, specifications, and pricing.`;
  return `${destination}${destination.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
}
