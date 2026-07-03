import Link from "next/link";

interface Props {
  id: string;
  project: string;
  title: string;
  price?: number;
  city?: string;
}

export function ListingCard({ id, project, title, price, city }: Props) {
  return (
    <Link
      href={`/${project}/listing/${id}`}
      className="block bg-white rounded-lg border p-4 hover:border-brand hover:shadow-md transition"
    >
      <h3 className="font-semibold mb-1 line-clamp-2">{title}</h3>
      {city && <p className="text-sm text-gray-500 mb-2">{city}</p>}
      {price != null && <p className="text-brand font-bold">{price} ₴</p>}
    </Link>
  );
}
