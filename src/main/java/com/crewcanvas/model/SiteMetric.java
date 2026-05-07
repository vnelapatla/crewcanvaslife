package com.crewcanvas.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "site_metrics")
public class SiteMetric {

    @Id
    private LocalDate date;
    private long pageViews;

    public SiteMetric() {}

    public SiteMetric(LocalDate date, long pageViews) {
        this.date = date;
        this.pageViews = pageViews;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public long getPageViews() {
        return pageViews;
    }

    public void setPageViews(long pageViews) {
        this.pageViews = pageViews;
    }
}
