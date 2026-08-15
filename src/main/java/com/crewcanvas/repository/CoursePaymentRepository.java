package com.crewcanvas.repository;

import com.crewcanvas.model.CoursePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoursePaymentRepository extends JpaRepository<CoursePayment, String> {
}
