package com.crewcanvas.repository;

import com.crewcanvas.model.SiteMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SiteMetricRepository extends JpaRepository<SiteMetric, LocalDate> {
    
    @Query("SELECT COALESCE(SUM(s.pageViews), 0) FROM SiteMetric s WHERE s.date >= :startDate")
    long sumPageViewsSince(@Param("startDate") LocalDate startDate);
    
    @Query("SELECT COALESCE(SUM(s.pageViews), 0) FROM SiteMetric s")
    long sumTotalPageViews();
}
