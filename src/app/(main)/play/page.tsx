import { DistrictBlock } from "@/components/play/district-block";
import { TravelBlock } from "@/components/play/travel-block";
import { pageWrap } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; trip?: string; add?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit, trip, add }, trips, districts] = await Promise.all([
    searchParams,
    prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { entries: { orderBy: [{ sortAt: "asc" }, { createdAt: "asc" }] } },
    }),
    prisma.playDistrict.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className={pageWrap}>
      <TravelBlock trips={trips} edit={edit} tripId={trip} add={add} />
      <DistrictBlock districts={districts} edit={edit} />
    </div>
  );
}
