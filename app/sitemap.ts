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
          en: `${BASE_URL}/en`,
          vi: `${BASE_URL}/vi`,
        },
      },
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/login`,
          vi: `${BASE_URL}/vi/login`,
        },
      },
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/register`,
          vi: `${BASE_URL}/vi/register`,
        },
      },
    },
    {
      url: `${BASE_URL}/forgot-password`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/forgot-password`,
          vi: `${BASE_URL}/vi/forgot-password`,
        },
      },
    },
    // Vietnamese pages
    {
      url: `${BASE_URL}/vi`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/vi/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/vi/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/vi/forgot-password`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // English pages
    {
      url: `${BASE_URL}/en`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/en/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/forgot-password`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
