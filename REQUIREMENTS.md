# HOA Website — Requirements

**Community name: Winterhaven Village**

Source: Email from Jerry to the committee (received June 2026).

## Committee To-Dos (context)

- **A.** Pick a fun, descriptive name for the committee — short and memorable.
- **B.** Add more people now. Adrian has agreed to join to work on IT.
- **C.** Set a date for a Zoom call (targeting next week).
- **D.** Each member suggests a focus of interest for the committee — these become the Zoom agenda to prioritize.
- **E.** Sue is reviewing the bids and will split into two parts: **structural** and **facelift**.

## Jerry's Vision — Communication Tool

1. **Easy access, easy usage**
2. **Available to all residents with internet**
3. **Resident directory** with:
   - Contact info
   - Photo
   - Short bio paragraph
   - Photo of residence
   - Photo and name of pets
4. **Humor column** — twice weekly
5. **Board info / updates**
   - Board member photo, contact info, and bio
   - Minutes of meetings
   - Project updates
   - Frequent communication
6. **CC&R column**
   - Weekly question and answer
   - Place for comments
7. **Weekly community update news**
8. **Public comment board**

## Earlier Requirements (from Jerry's first email)

- Easy to use
- Interactive with everyone
- Contact directory with photos (opt-in)
- Different pages for different info
- Digital newsletter, frequently updated
- Photos of the community's outstanding setting

## Timeline

- **Board meets June 24, 2026** — reports go out a week early (~June 17), so a description and mockup are needed by then.
- Committee Zoom call planned for the week of June 8.

## Technical Constraints

- **Hosting:** Free Vercel instance — must stay within free-tier limits (serverless functions, bandwidth, build minutes).
- **Database:** Free-tier database attached to Vercel (e.g., Neon Postgres) — design around free-tier row/storage/connection limits.
- **Traffic:** Very low volume — small community. No need for scale engineering, caching layers, or premium infra.
- **Front-end quality: spare no expense.** The UI is the product — polished, beautiful, premium feel. Budget constraints apply to infrastructure only, never to design quality.

## Committee Feedback — July 2026 (Jerry's email after committee meeting)

Committee present: Jerry, Kay, Robin, Kathleen (Sue not mentioned).

1. **Design direction settled:** committee saw the choice narrowed to #6 (Quiet Luxury) and unanimously approved — "as good as any because they were all good."
2. **Public/private split:**
   - A general public page anyone can access: mission statement + general info on the community. Jerry suggests a photo of the mountains and gate driving in.
   - **Access by password to the rest** — more content behind login than originally assumed.
3. **Interactive vs. informational:** views varied; consensus is a mix of both.
4. **Moderation/monitoring:** open questions about who monitors and responds — needs a concrete proposal from Adrian.
5. **Priorities per Jerry:** directory is important, human-interest content, humor, and a positive way to start presenting the project. Committee open to meeting again and following Adrian's guidance on format.

Content needed from committee: mission statement text, photo of the entrance/mountains.

## Notes

- Photos/bios in the directory are **opt-in** ("for those who choose").
- Robin is available to meet in person if helpful.
- Kay and Robin may add to the requirements list.
