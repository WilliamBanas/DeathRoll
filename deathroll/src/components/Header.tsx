import Image from "next/image";

export default function Header() {
	return (
		<header className="h-32 flex items-center justify-center px-6 py-2">
      <div className="w-fit relative">
				<Image src="/assets/logo/Deathroll.svg" alt="" loading="eager" width={0} height={0} style={{ width: "auto", height: "auto" }} />
        <div className="badge badge-error badge-sm text-white absolute top-0 right-0 rotate-12 -translate-y-1/2 translate-x-1/2 animate-shake-delayed ">
          beta
        </div>
			</div>
		</header>
	);
}
