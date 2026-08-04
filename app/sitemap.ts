import { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()

  return [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          en: `${BASE_URL}/`,
          vi: `${BASE_URL}/vi`,
        },
      },
    },
    {
      url: `${BASE_URL}/vi`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${BASE_URL}/`,
          vi: `${BASE_URL}/vi`,
        },
      },
    },
  ]
}