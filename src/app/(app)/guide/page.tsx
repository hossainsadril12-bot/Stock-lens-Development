import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getFeedback } from "@/lib/queries";
import { submitFeedback } from "@/app/data-actions";
import { date } from "@/lib/format";
import s from "@/components/shared.module.css";
import g from "./guide.module.css";

const T = ({ children }: { children: React.ReactNode }) => <span className={g.term}>{children}</span>;
const Yes = () => <span style={{ color: "#10b981", fontWeight: 700 }}>Yes</span>;
const No = () => <span className={s.muted}>No</span>;

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const sp = await searchParams;

  const isAdmin = can(user.role, "team.manage");
  const canOperate = can(user.role, "item.create"); // staff + admin do the daily work
  const roleLabel = isAdmin ? "Admin / Owner" : canOperate ? "Staff" : "Viewer";
  const feedback = isAdmin ? await getFeedback() : [];

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>User Guide</h1>
          <p className={s.sub}>You are signed in as <strong>{roleLabel}</strong>. This guide shows what you can do.</p>
        </div>
      </div>

      {sp.sent === "1" && (
        <div className={g.sent}>Thank you — your feedback was sent. We read every message.</div>
      )}

      <div className={g.toc}>
        <a className={g.tocLink} href="#everyone">Everyone</a>
        {canOperate && <a className={g.tocLink} href="#staff">Daily work</a>}
        {isAdmin && <a className={g.tocLink} href="#admin">Admin control</a>}
        <a className={g.tocLink} href="#feedback">Feedback</a>
      </div>

      {/* Intro + role matrix */}
      <div className={s.panel}>
        <h3 className={s.panelTitle}>What StockLens is</h3>
        <div className={g.body}>
          <p>StockLens keeps track of your stock. It changes shape to fit what you sell — a warehouse, real-estate units, equipment, software licences, or kits. What you can do depends on your role:</p>
          <div className={s.tableWrap} style={{ marginTop: 8 }}>
            <table className={s.table}>
              <thead>
                <tr><th>Task</th><th>Admin</th><th>Staff</th><th>Viewer</th></tr>
              </thead>
              <tbody>
                <tr><td>View dashboard, items, reports</td><td><Yes /></td><td><Yes /></td><td><Yes /></td></tr>
                <tr><td>Add / edit items</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Delete items</td><td><Yes /></td><td><No /></td><td><No /></td></tr>
                <tr><td>Scan stock, sell at checkout</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Manage categories</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Import a spreadsheet (CSV)</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Raise a purchase order</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Approve a purchase order</td><td><Yes /></td><td><No /></td><td><No /></td></tr>
                <tr><td>Receive a purchase order</td><td><Yes /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Dispatch / approve a transfer</td><td><Yes /></td><td><No /></td><td><No /></td></tr>
                <tr><td>Request / receive a transfer</td><td><No /></td><td><Yes /></td><td><No /></td></tr>
                <tr><td>Manage suppliers</td><td><Yes /></td><td><No /></td><td><No /></td></tr>
                <tr><td>Manage employees &amp; drivers</td><td><Yes /></td><td><No /></td><td><No /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Part 1 — Everyone */}
      <div className={s.panel} id="everyone">
        <h3 className={s.panelTitle}>Everyone — the basics</h3>
        <div className={g.body}>
          <p><strong>Getting started</strong></p>
        </div>
        <ol className={g.steps}>
          <li>Sign in with the email and password you were given.</li>
          <li>Pick the industries you manage, then press <T>Continue</T>.</li>
          <li>{canOperate ? <>Upload a spreadsheet of stock now, or press <T>Skip for now</T>.</> : <>You land on the dashboard.</>}</li>
        </ol>
        <div className={g.body} style={{ marginTop: 12 }}>
          <p><strong>Switch workspace.</strong> If you picked more than one industry, use the switcher in the top bar to move between them. Each keeps its own items and dashboard.</p>
          <p><strong>Dashboard.</strong> Shows your key numbers, a <em>Needs you today</em> band, a trend chart, and recent activity.</p>
          <p><strong>Notifications.</strong> The bell in the top bar shows updates. A red number means unread.</p>
          <p><strong>Sort a table.</strong> Click any column heading to sort; click again to reverse.</p>
          <p><strong>Your account.</strong> Click your name (top right) for User Guide, Settings, Privacy, About, and Sign out.</p>
          <p><strong>Light or dark.</strong> Use the sun / moon button in the top bar.</p>
        </div>
      </div>

      {/* Part 2 — Staff (daily work) */}
      {canOperate && (
        <div className={s.panel} id="staff">
          <h3 className={s.panelTitle}>Daily work</h3>
          <div className={g.body}>
            <p><strong>Items and stock</strong> — open <strong>Items</strong> from the left menu.</p>
            <p>Add an item with <T>Add product</T>. Edit one by clicking its name, then <T>Edit</T>.{isAdmin ? " As an Admin you can also delete it." : " (Only an Admin can delete an item.)"}</p>
            <p>Add stock by scanning: press <T>Scan barcode</T>, use a USB scanner or type the code and press Enter. A known code adds one to stock; an unknown code offers to make a new item.</p>
            <p>Bring in a spreadsheet with <T>Import CSV</T> — download the template, fill it, upload, check the preview, import.</p>
          </div>

          <div className={g.body} style={{ marginTop: 12 }}>
            <p><strong>Sell to a customer</strong></p>
          </div>
          <ol className={g.steps}>
            <li>On <strong>Items</strong>, press <T>Checkout</T>.</li>
            <li>Scan each product, or add it from the list. Scan again for another of the same.</li>
            <li>Type the customer name.</li>
            <li>Press <T>Complete sale</T>. Stock drops and a receipt opens — press <T>Print receipt</T>.</li>
          </ol>

          <div className={g.body} style={{ marginTop: 12 }}>
            <p><strong>Categories.</strong> Open <strong>Categories</strong> to add, rename, or delete groups. Click one to open it and scan barcodes to add stock straight into that group.</p>
            <p><strong>Purchase orders.</strong> Press <T>New PO</T>, pick item, quantity, supplier, date. An Admin approves it. When goods arrive, press <T>Receive</T> — stock is added and the Admin is notified.</p>
            <p><strong>Transfers.</strong> Press <T>Request transfer</T> to ask for stock from another location. When it arrives, press <T>Received</T> — stock updates and the Admin is notified.</p>
            <p><strong>Reports.</strong> Open <strong>Reports</strong> for stock movements, low stock, and stock value. You can export.</p>
          </div>
        </div>
      )}

      {/* Part 3 — Admin */}
      {isAdmin && (
        <div className={s.panel} id="admin">
          <h3 className={s.panelTitle}>Admin control</h3>
          <div className={g.body}>
            <p><strong>Delete items.</strong> Open an item, press <T>Delete</T>, and confirm.</p>
            <p><strong>Suppliers.</strong> Open <strong>Suppliers</strong>. Add with <T>Add supplier</T> (name, phone, lead time); edit or delete each row.</p>
            <p><strong>Purchase orders.</strong> A staff PO shows <em>Pending approval</em> — press <T>Approve</T> to send it. When goods arrive, press <T>Receive</T>.</p>
            <p><strong>Transfers.</strong> Dispatch a transfer with a vehicle and driver, and approve or reject staff requests. Staff at the far end press <T>Received</T> and you get a notification.</p>
            <p><strong>Employees and drivers.</strong> Open <strong>Employees</strong>. The Staff tab adds people who log in; the Drivers tab adds drivers. Use <T>Add employee</T> / <T>Add driver</T>, then Edit or Delete. You cannot delete yourself.</p>
            <p><strong>Feedback inbox.</strong> User feedback appears at the bottom of this page under <em>Feedback received</em>.</p>
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className={s.panel} id="feedback">
        <h3 className={s.panelTitle}>Having a problem? Tell us</h3>
        <div className={g.body}>
          <p>If something does not work or feels confusing, send us a note. We read every message and use it to improve StockLens.</p>
        </div>
        <form action={submitFeedback} className={s.form} style={{ marginTop: 10 }}>
          <div className={s.field}>
            <label className={s.label} htmlFor="message">Your feedback <span className={s.req}>*</span></label>
            <textarea className={s.textarea} id="message" name="message" rows={4} placeholder="Describe the problem or idea…" required />
          </div>
          <div className={s.formActions}>
            <button className={s.btnPrimary} type="submit">Send feedback</button>
          </div>
        </form>
      </div>

      {/* Admin: feedback received */}
      {isAdmin && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Feedback received</h3>
          {feedback.length === 0 ? (
            <p className={s.muted}>No feedback yet.</p>
          ) : (
            <div>
              {feedback.map((f) => (
                <div key={f.id} className={g.fbItem}>
                  <div>{f.message}</div>
                  <div className={g.fbWho}>{f.userName ?? "Someone"} · {date(f.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
