import { getRequestConfig } from 'next-intl/server';
 
export default getRequestConfig(async () => {
  const locale = 'pt-BR'; // Locale padrão para a aplicação
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
