package com.transitops.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * TransitOps Fleet Command - main entry point.
 *
 * Run this class (or `mvn spring-boot:run`) and open http://localhost:8080
 * in a browser. Spring Boot serves the existing frontend (index.html /
 * app.js / styles.css) as static content AND exposes the REST API under
 * /api/**, so there is no CORS to configure - everything is same-origin.
 *
 * This class also extends SpringBootServletInitializer, which lets the
 * exact same code be deployed as a WAR to an external servlet container
 * (e.g. via Eclipse's "Dynamic Web Project" + external Tomcat). No web.xml
 * changes are needed - Spring registers its DispatcherServlet automatically
 * on any Servlet 3.0+ container, including Tomcat 10.1.
 */
@SpringBootApplication
public class TransitOpsApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(TransitOpsApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(TransitOpsApplication.class, args);
    }
}
