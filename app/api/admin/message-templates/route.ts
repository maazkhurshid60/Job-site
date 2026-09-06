import { handle, ok, jsonBody, str, BadRequest } from "@/lib/server/respond";
import { getSetting, setSetting } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import {
  ADMIN_EMAIL_TEMPLATES,
  isAllowedCtaPath,
  TEMPLATE_LIMITS,
  type CustomTemplate,
} from "@/lib/adminEmailTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTING_KEY = "admin_message_templates";

/* Templates an admin writes in the console, on top of the built-in set.
 *
 * Stored as JSON in `settings` rather than a table of their own: there are
 * at most a few dozen, they're always read and written as one list, and the
 * settings row already exists. A table would buy nothing and cost a
 * migration. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await getSetting<CustomTemplate[]>(SETTING_KEY, []));
  });
}

/** Replaces the whole list — the editor sends its full state, the same way
    the board-filter lists work. */
export function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const body = await jsonBody(req);

    if (!Array.isArray(body.templates)) {
      throw new BadRequest("Send a `templates` array.");
    }
    if (body.templates.length > TEMPLATE_LIMITS.count) {
      throw new BadRequest(`That's more than ${TEMPLATE_LIMITS.count} templates.`);
    }

    const builtInIds = new Set(ADMIN_EMAIL_TEMPLATES.map((t) => t.id));
    const seen = new Set<string>();
    const clean: CustomTemplate[] = [];

    for (const raw of body.templates as Record<string, unknown>[]) {
      const label = str(raw.label, "label", { required: true, max: TEMPLATE_LIMITS.label });
      const subject = str(raw.subject, "subject", { required: true, max: TEMPLATE_LIMITS.subject });
      const bodyText = str(raw.body, "body", { required: true, max: TEMPLATE_LIMITS.body });
      const hint = str(raw.hint, "hint", { max: TEMPLATE_LIMITS.hint });
      const ctaPath = str(raw.ctaPath, "ctaPath", { max: 128 });

      /* Not free-form: an arbitrary destination would make every template an
         open redirect, since these land in emails and dashboard alerts. */
      if (ctaPath && !isAllowedCtaPath(ctaPath)) {
        throw new BadRequest(`"${ctaPath}" isn't one of the allowed button destinations.`);
      }

      /* Ids come from the client so an edit updates in place rather than
         replacing the row, but they can't collide with a built-in — that
         would silently shadow a template the product refers to by name. */
      const id = str(raw.id, "id", { required: true, max: 64 });
      if (builtInIds.has(id)) {
        throw new BadRequest(`"${id}" is a built-in template id and can't be reused.`);
      }
      if (seen.has(id)) throw new BadRequest("Two templates share an id.");
      seen.add(id);

      clean.push({ id, label, hint, subject, body: bodyText, ctaPath });
    }

    /* Not written to the audit log, matching the other settings endpoints
       (categories, board filters). Those record configuration, not actions
       taken against a person, and the log is more useful for staying about
       the latter. Adding an entry here would also need a new value in the
       admin_audit_log action ENUM — and a missing ENUM value under
       STRICT_ALL_TABLES surfaces as a 500 on a write that already half
       succeeded, which this codebase has been bitten by twice. */
    await setSetting(SETTING_KEY, clean);

    return ok({ templates: clean });
  });
}
