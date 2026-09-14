# Federation Hub

Build a production-grade Sports & Gaming Federation Management Web Application with complete authentication and role-based scoped dashboards (National, State, District, Match Official, Public).

### 1. ENVIRONMENT CONFIGURATION & DATABASE SECRETS

Do not hardcode secrets. Read database connection parameters strictly from environment variables:

- `DB_HOST`: Hostinger MySQL Server IP/Host (e.g. srv2213.hstgr.io or 31.97.2.1)

- `DB_PORT`: 3306

- `DB_NAME`: u229963625_tadminks

- `DB_USER`: u229963625_tadminks

- `DB_PASSWORD`: [Stored in Environment Secrets]

Implement a serverless middleware / API router (e.g. using `mysql2/promise`) connecting to this database pool to execute stored procedures and return JSON to the frontend.

---

### 2. AUTHENTICATION & ACCESS CONTROL (RBAC)

Authenticate users against the `users` table (`email`, `password_hash`, `role_id`, `state_id`, `district_id`, `status`).

- Only accounts with `status = 'approved'` may access administrative features.

- If `status = 'pending'`, show a "Waiting for Approval" screen.

- If `status = 'suspended'`, show an "Account Suspended" alert.

#### Scoped Role-Based Routing

After successful login, route users to their dedicated dashboard:

1. **National Admin Dashboard (`role_id = 1`):**

   - Full visibility across all states and districts.

   - Master controls: approve/reject State Admins, manage Team India squads, sanction national tournaments.

   - Unfreeze locked rosters using `sp_transition_roster_status`.

   - Correct certified match scores using `sp_correct_certified_result`.

2. **State Admin Dashboard (`role_id = 2`):**

   - Scoped strictly to `user.state_id`.

   - Review and approve/reject District Admins in their state.

   - Manage State Squads and register them for National Championships via `sp_register_tournament_team`.

   - Certify completed state match results (enforcing separation of duties).

3. **District Admin Dashboard (`role_id = 3`):**

   - Scoped strictly to `user.district_id`.

   - Grassroots player directory: register players and team staff.

   - Build district team rosters and submit them (`DRAFT` -> `SUBMITTED`).

4. **Match Official Console (`role_id = 4`):**

   - Scoped exclusively to fixtures assigned in `match_official_assignments`.

   - Live scoring sheet: record scores, log player points/cards, select Man of the Match.

   - Finalize match via `sp_record_match_result`.

5. **Public Spectator Portal (No login required):**

   - Standings table, upcoming fixture schedules, post-match recap news, rulebook downloads, and circulars.

---

### 3. MANDATORY STORED PROCEDURE WORKFLOWS

All state transitions, approvals, score entries, and registrations MUST invoke the following database procedures:

1. User Approval: `CALL sp_approve_user(p_actor_id, p_target_user_id, p_new_status, p_reason);`

2. Roster Lifecycle: `CALL sp_transition_roster_status(p_actor_id, p_team_id, p_target_status, p_reason);`

   - Cycle: `draft` -> `submitted` -> `approved` -> `frozen`

3. Tournament Registration: `CALL sp_register_tournament_team(p_actor_id, p_tournament_id, p_team_id, p_group_name, p_reason);`

4. Record Match Score: `CALL sp_record_match_result(p_actor_id, p_match_id, p_team1_score, p_team2_score, p_man_of_match_player_id, p_summary);`

5. Certify Result: `CALL sp_certify_match_result(p_actor_id, p_match_id, p_reason);`

6. Correct Certified Score: `CALL sp_correct_certified_result(p_actor_id, p_match_id, p_new_team1_score, p_new_team2_score, p_reason);`

7. Recalculate Standings: `CALL sp_recalculate_standings(p_tournament_id);`

---

### 4. CORE APPLICATION MODULES & UI

1. **User Approval Queue:** Table displaying pending user registrations with an "Action" modal requiring an approval/rejection reason string before calling `sp_approve_user`.

2. **Squad & Roster Builder:** UI to draft rosters from active players. Display a visual padlock badge when `roster_status = 'frozen'` and disable editing controls.

3. **Tournament Match Center:** 

   - Standings table reading directly from `standings` (Played, Won, Lost, Tied, Points, Score Difference).

   - Scorer dialog with inputs for scores, MVP dropdown (filtered strictly to on-roster active players), and match recap summary.

4. **Governance & CMS:** Download center for PDF rulebooks and a notices feed filtered by audience level.

---

### 5. ERROR HANDLING

The database enforces strict zero-trust triggers. Catch `SQLSTATE '45000'` exceptions and render user-friendly toast messages displaying the returned invariant code (e.g., `INV-01`, `INV-02`, `INV-03`, `INV-04`, `INV-05`, `INV-06`, `INV-08`, `INV-09`).

---

### 6. RAJASTHAN SEPAK TAKRAW ASSOCIATION (RSTA)

Official state portal governing Sepak Takraw (Regu, Doubles, Team Event) and Aatya Paatya (Traditional Indigenous Discipline).
- **Headquarters**: Sawai Mansingh (SMS) Stadium, Jaipur, Rajasthan 302005.
- **Affiliation**: Sepaktakraw Federation of India (STFI) & Rajasthan State Sports Council (RSSC).
- **Executive Leadership**: Presided over by Shri T. K. Singh (NIS Coach) and Head Coach Jagdish Prajapat.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
