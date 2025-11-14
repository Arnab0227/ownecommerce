// Featured collections configuration and utilities
export const FEATURED_COLLECTIONS = {
  "womens-hot-pick": {
    id: "womens-hot-pick",
    label: "Women's Hot Pick",
    description: "Timeless elegance crafted with 35+ years of expertise",
    bgColor: "from-amber-400 to-yellow-500",
    badgeColor: "bg-pink-100 text-pink-700",
    accentColor: "#ec4899",
  },
  "traditional-ethnic": {
    id: "traditional-ethnic",
    label: "Traditional Ethnic Wear",
    description: "Authentic Indian craftsmanship meets modern comfort",
    bgColor: "from-orange-400 to-red-500",
    badgeColor: "bg-amber-100 text-amber-700",
    accentColor: "#f97316",
  },
  "childrens-premium": {
    id: "childrens-premium",
    label: "Children's Premium Line",
    description: "Gentle fabrics and playful designs for little treasures",
    bgColor: "from-yellow-400 to-orange-500",
    badgeColor: "bg-purple-100 text-purple-700",
    accentColor: "#a855f7",
  },
  "curated-casual": {
    id: "curated-casual",
    label: "Curated Casual Wear",
    description: "Effortless style for everyday elegance",
    bgColor: "from-amber-500 to-yellow-600",
    badgeColor: "bg-blue-100 text-blue-700",
    accentColor: "#3b82f6",
  },
  "handpicked": {
    id: "handpicked",
    label: "Handpicked Collection",
    description: "Our expert selection of premium pieces",
    bgColor: "from-green-400 to-emerald-500",
    badgeColor: "bg-green-100 text-green-700",
    accentColor: "#10b981",
  },
}

export type FeaturedCollectionId = keyof typeof FEATURED_COLLECTIONS

export function getFeaturedCollection(id: string) {
  return FEATURED_COLLECTIONS[id as FeaturedCollectionId]
}

export function parseFeaturedCollections(value: string | string[] | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    return typeof value === "string" ? JSON.parse(value) : []
  } catch {
    console.error("Failed to parse featured collections:", value)
    return []
  }
}

export function stringifyFeaturedCollections(collections: string[]): string {
  return JSON.stringify(collections)
}

export function getCollectionLabel(id: string): string {
  return getFeaturedCollection(id)?.label || id
}

export function getCollectionConfig(id: string) {
  return getFeaturedCollection(id) || {
    label: id,
    bgColor: "from-gray-400 to-gray-500",
    badgeColor: "bg-gray-100 text-gray-700",
    accentColor: "#6b7280",
  }
}
