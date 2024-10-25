import Logo from "../app/assets/logo/Deathroll.svg"

export default function Header() {
	return (
		<header className="h-32 flex items-center justify-center h-32 px-6 py-2">
      <div className="w-fit relative">
				<Logo />
        <div className="badge badge-error badge-sm text-white absolute top-0 right-0 rotate-12 -translate-y-1/2 translate-x-1/2 animate-shake-delayed ">
          beta
        </div>
			</div>
		</header>
	);
}
