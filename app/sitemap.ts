import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { subjectPanels } from "@/lib/dashboard";
import { lessons } from "@/lib/lessons";
import { allResources } from "@/components/dashboard/ResourcePage";
import { simulationCatalog } from "@/lib/simulations";

/**
 * Барлық статикалық маршрут. Тізім мазмұннан құрастырылады, сондықтан жаңа
 * пән, ресурс, сабақ немесе симуляция қосылғанда бұл файлды түзетудің қажеті
 * жоқ — карта өзі кеңейеді.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${site.url}${path}`;

  return [
    { url: site.url, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: url("/dashboard"), lastModified, changeFrequency: "weekly", priority: 0.9 },

    { url: url("/dashboard/lessons"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/dashboard/simulations"), lastModified, changeFrequency: "weekly", priority: 0.8 },

    ...subjectPanels.map((subject) => ({
      url: url(`/dashboard/modules/${subject.id}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...allResources.map((resource) => ({
      url: url(`/dashboard/resources/${resource.id}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...lessons.map((lesson) => ({
      url: url(`/dashboard/lessons/${lesson.id}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...simulationCatalog.map((sim) => ({
      url: url(sim.href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
