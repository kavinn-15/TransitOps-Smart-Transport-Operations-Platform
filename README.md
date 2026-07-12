# TransitOps Fleet Command — Full-Stack Setup Guide

A complete backend for your existing TransitOps frontend, built with
**Spring Boot (Spring Core + Spring MVC, which runs on the Servlet API) +
Hibernate (via Spring Data JPA) + MySQL**. The frontend (`index.html`,
`app.js`, `styles.css`) is included, already rewritten to call the REST API
instead of using an in-memory array, and is served directly by Spring Boot —
so there is nothing else to deploy and no CORS to configure.

---

## 1. Prerequisites

Install these once, before opening the project:

1. **Java JDK 17 or newer** — `java -version` should print 17+.
2. **Eclipse IDE for Enterprise Java and Web Developers** (the "Java EE" /
   "Jakarta EE" edition, so it has Maven support built in — it comes with m2e).
3. **MySQL Server 8.x**, running locally, with a user that can log in
   (default in this project: user `root`, password `root`).
   You can use MySQL Workbench or the `mysql` CLI to confirm you can connect.

You do **not** need to manually create the database or any tables — see
step 4.

---

## 2. Import the project into Eclipse

This project is already set up as a **Maven-based Dynamic Web Project**
(packaging `war`, plus the `.project`/`.settings` files Eclipse needs), so it
imports directly and can be run on an external Tomcat server from the
**Servers** view, exactly like a hand-written Servlet project.

1. Unzip the project you downloaded — you'll get a folder named
   `transitops` containing `pom.xml`, `src/`, `.project`, etc.
2. In Eclipse: **File → Import… → Existing Projects into Workspace**
   (not "Maven → Existing Maven Projects" — that skips the Dynamic Web
   Module facet already configured in this folder).
3. Browse to the unzipped `transitops` folder, select it, click **Finish**.
4. Eclipse/m2e will resolve all dependencies automatically (Spring Boot,
   Spring Data JPA, Hibernate, MySQL driver, etc.) the first time — this
   needs an internet connection once, to download the jars into your local
   `~/.m2` repository.
5. Right-click the project → **Maven → Update Project…** → OK, so the
   `.classpath`/facets line up with your local Maven repo.
6. Wait for the build to finish (no red error markers on the project). If
   Eclipse asks to install "Apache Tomcat v10.1", point it at your actual
   Tomcat 10.1 installation (**Window → Preferences → Server → Runtime
   Environments → Add…**) if you haven't already.

*(If you'd rather run it as a plain Spring Boot jar with the embedded
Tomcat instead of a Dynamic Web Project on external Tomcat, you can still
use File → Import… → Maven → Existing Maven Projects — the `main()` method
in `TransitOpsApplication` still works either way.)*

---

## 3. Configure your MySQL credentials

Open `src/main/resources/application.properties` and edit these two lines to
match your local MySQL setup:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

The database itself (`transitops_db`) is created automatically the first
time the app connects (`createDatabaseIfNotExist=true` in the JDBC URL) —
as long as your MySQL user has permission to create databases.

---

## 4. How the database tables get created

You do not need to write or run any `CREATE TABLE` SQL yourself. This project
uses:

```properties
spring.jpa.hibernate.ddl-auto=update
```

On startup, Hibernate reads the `@Entity` classes in
`com.transitops.fleet.model` and automatically creates every table your
frontend needs:

| Table                  | Backs                                   |
|------------------------|------------------------------------------|
| `users`                | Login / RBAC accounts                    |
| `vehicles`             | Fleet registry                           |
| `drivers`              | Drivers & Safety Profiles                |
| `trips`                | Trip Dispatcher / Live Board             |
| `maintenance_records`  | Maintenance / Service Log                |
| `fuel_logs`            | Fuel & Expense Management (fuel side)    |
| `expenses`             | Fuel & Expense Management (toll/misc)    |

The very first time you run the app (when `users` is empty), a
`DataSeeder` component automatically inserts the same demo data your
original mock UI shipped with (the 5 demo logins, 5 vehicles, 4 drivers, a
few trips/maintenance/fuel/expense rows) so the app looks populated
immediately. On every later restart it detects existing data and skips
seeding, so nothing you add gets wiped.

---

## 5. Run it

**Option A — as a Dynamic Web Project on external Tomcat (Eclipse Servers
view):** right-click the `transitops` project → **Run As → Run on Server**,
pick your Tomcat 10.1 server, click **Finish**. Eclipse builds the WAR,
deploys it to Tomcat, and starts the server. Because `pom.xml` now declares
`<packaging>war</packaging>` with `spring-boot-starter-tomcat` marked
`provided`, and `TransitOpsApplication` extends
`SpringBootServletInitializer`, Spring registers its `DispatcherServlet`
itself on startup — you don't need to write or edit `web.xml` at all. The
included `WEB-INF/web.xml` is intentionally close to empty; leave it that
way (see the comment inside it about why a bad `<url-pattern>` like
`index`, without a leading `/`, is what caused Tomcat to refuse to start
before).

**Option B — in Eclipse, as a plain Spring Boot jar:** right-click
`TransitOpsApplication.java` → **Run As → Java Application**.

**From a terminal (also works, and is what "run in the console" usually
means):**
```bash
cd transitops
./mvnw spring-boot:run          # Linux/Mac, if you generate the wrapper
# or, if you have Maven installed globally:
mvn spring-boot:run
```

You'll see Spring Boot's banner and log lines ending with something like:
```
Tomcat started on port(s): 8080 (http)
Started TransitOpsApplication in x.xxx seconds
```

Then open **http://localhost:8080** in your browser. That's it — login
screen, dashboard, fleet, drivers, trips, maintenance, fuel, analytics and
settings are all live against MySQL.

Demo logins (password for all: `demo123`):
| Email                        | Role               |
|-------------------------------|--------------------|
| admin@transitops.in           | Administrator      |
| raven.k@transitops.in         | Dispatcher         |
| meera.s@transitops.in         | Fleet Manager      |
| arjun.p@transitops.in         | Safety Officer     |
| kabir.n@transitops.in         | Financial Analyst  |

---

## 6. What's implemented, end to end

- **Dashboard** — vehicle type / status filters call
  `GET /api/dashboard/summary?type=&status=`, which reads live vehicle,
  trip and driver rows from MySQL and returns all KPI numbers, the vehicle
  status breakdown, and the 4 most recent trips.
- **Fleet** — type/status/search filters call
  `GET /api/vehicles?type=&status=&search=`. "+ Add Vehicle" calls
  `POST /api/vehicles` with a uniqueness check on registration number.
  Status dropdown calls `PATCH /api/vehicles/{reg}/status`.
- **Drivers & Safety Profiles** — `GET /api/drivers` lists everyone;
  Create/Update/Delete are gated per role exactly like the original
  `DRIVER_PERMS` matrix, enforced **again on the backend** (not just hidden
  in the UI) via `RbacService`. Delete calls
  `DELETE /api/drivers/{license}`, Add calls `POST /api/drivers`.
- **Trip Dispatcher** — "Dispatch" calls `POST /api/trips/dispatch`, which
  re-validates vehicle availability, driver availability/license expiry, and
  cargo ≤ capacity server-side before flipping the vehicle & driver to
  "On Trip" and inserting the trip row. "Complete" calls
  `POST /api/trips/{code}/complete`, which updates the odometer, frees the
  vehicle/driver, and (if fuel numbers were entered) inserts a fuel log row.
  The Live Board renders from `GET /api/trips`.
- **Maintenance** — "Save" calls `POST /api/maintenance`, which creates the
  service record and moves the vehicle to "In Shop" (unless retired).
  "Close" calls `POST /api/maintenance/{id}/close`, which completes the
  record and — only if no other "In Shop" record remains for that vehicle —
  frees it back to "Available".
- **Fuel & Expense Management** — `POST /api/fuel` and `POST /api/expenses`
  insert rows; the expense table's "Maint. (linked)" and "Total" columns are
  computed by joining maintenance cost for that vehicle, same as the
  original mock.
- **Analytics** — `GET /api/analytics/summary` computes fuel efficiency
  (km/L), fleet utilization %, total operational cost (fuel + maintenance),
  and vehicle ROI, plus the "Top Costliest Vehicles" ranking — all from live
  MySQL data.
- **Settings** — the RBAC table is static reference info, matching the same
  permission matrix the backend enforces.

---

## 7. Project layout

```
transitops/
├── pom.xml
├── src/main/java/com/transitops/fleet/
│   ├── TransitOpsApplication.java      (entry point)
│   ├── model/         Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense, AppUser (JPA/Hibernate entities)
│   ├── repository/    Spring Data JPA repositories (one per entity)
│   ├── service/       Business logic + validation + RBAC (mirrors the original app.js rules)
│   ├── controller/    REST controllers under /api/**
│   ├── dto/           Request payloads (login, trip actions, status updates)
│   ├── exception/     ApiException + a @RestControllerAdvice that turns errors into clean JSON
│   └── config/        DataSeeder (inserts demo data on first run)
└── src/main/resources/
    ├── application.properties
    └── static/         index.html, app.js, styles.css  (your frontend, served by Spring Boot)
```

## 8. Notes on the "Servlet" requirement

Spring MVC (`spring-boot-starter-web`) is itself built directly on top of the
Jakarta Servlet API and runs inside an embedded Tomcat servlet container —
every `@RestController` method in this project is dispatched through a
`DispatcherServlet` under the hood. This satisfies the "Servlet" part of your
stack requirement without you needing to hand-write a raw
`HttpServlet` — that's exactly what Spring Boot is for.

## 9. Common issues

- **"Communications link failure" / can't connect to MySQL** — make sure
  MySQL is actually running, and that `username`/`password` in
  `application.properties` are correct.
- **Port 8080 already in use** — change `server.port` in
  `application.properties`.
- **Table already exists with different columns from an old run** — with
  `ddl-auto=update`, Hibernate does not drop columns. If you heavily edited
  an entity, it's simplest to drop the `transitops_db` schema in MySQL and
  let it be recreated + reseeded on next run.
