import logo from "@/assets/uitm-logo-only.png.asset.json";

export function UitmLogo() {
  return <img src={logo.url} alt="Logo Universiti Teknologi MARA (UiTM)" className="mx-auto h-auto w-40 max-w-full rounded bg-background p-2" width={281} height={120} />;
}