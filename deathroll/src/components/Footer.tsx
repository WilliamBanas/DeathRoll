export default function Footer() {
  const date = new Date
  const year = date.getFullYear()

  return (
    <footer className="w-full flex items-center justify-center h-24 px-6 py-2">
      {`© William Banas - ${year}`}
    </footer>
  )
}

