package com.it3030.paf.smartcampus.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@EnableConfigurationProperties(AppSecurityProperties.class)
public class SecurityConfig {

  private static final DefaultCorsProcessor CORS_PROCESSOR = new DefaultCorsProcessor();

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.cors(Customizer.withDefaults());
    http.sessionManagement(sm -> sm.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS));

    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/error").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
            .anyRequest().authenticated()
        );

    http.exceptionHandling(exception -> exception
        .authenticationEntryPoint((request, response, authException) -> {
          try {
            applyCorsIfNeeded(request, response, corsConfigurationSource);
            if (!response.isCommitted()) {
              response.setHeader("WWW-Authenticate", "Basic realm=\"Realm\"");
              response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            }
          } catch (IOException e) {
            throw new RuntimeException(e);
          }
        })
        .accessDeniedHandler((request, response, accessDeniedException) -> {
          try {
            applyCorsIfNeeded(request, response, corsConfigurationSource);
            if (!response.isCommitted()) {
              response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            }
          } catch (IOException e) {
            throw new RuntimeException(e);
          }
        }));

    http.httpBasic(org.springframework.security.config.Customizer.withDefaults());
    return http.build();
  }

  private static void applyCorsIfNeeded(
      HttpServletRequest request,
      HttpServletResponse response,
      CorsConfigurationSource corsConfigurationSource)
      throws IOException {
    CorsConfiguration corsConfiguration = corsConfigurationSource.getCorsConfiguration(request);
    if (corsConfiguration != null) {
      CORS_PROCESSOR.processRequest(corsConfiguration, request, response);
    }
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}

