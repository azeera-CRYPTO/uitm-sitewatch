<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Staff report mutations use authenticated server functions with explicit ownership checks and RLS; database triggers preserve original capture fields to prevent direct API tampering.
- Photo cleanup uses the Storage API only after verifying and deleting the caller-owned report; legacy date-based photo paths are supported.
- Shared Google sign-in returns to the public home page and restores only a fixed same-origin destination after session establishment.
- Generate report PDFs in the browser through a shared export control; use native file sharing when supported and a download plus WhatsApp message fallback, because WhatsApp links cannot attach local files.
- Represent missing report photos as null and filter empty paths before storage calls so optional evidence does not create invalid uploads or cleanup requests.
