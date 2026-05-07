package com.crewcanvas.controller;

import com.crewcanvas.model.SiteMetric;
import com.crewcanvas.repository.SiteMetricRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/public/metrics")
@CrossOrigin(origins = "*")
public class MetricController {

    @Autowired
    private SiteMetricRepository metricRepository;

    @PostMapping("/hit")
    public void recordHit() {
        LocalDate today = LocalDate.now();
        SiteMetric metric = metricRepository.findById(today).orElse(new SiteMetric(today, 0));
        metric.setPageViews(metric.getPageViews() + 1);
        metricRepository.save(metric);
    }
}
