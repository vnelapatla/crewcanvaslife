package com.crewcanvas.repository;

import com.crewcanvas.model.SiteMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface SiteMetricRepository extends JpaRepository<SiteMetric, LocalDate> {
}
