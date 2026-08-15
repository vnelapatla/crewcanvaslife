package com.crewcanvas.service;

import com.crewcanvas.model.CoursePayment;
import com.crewcanvas.repository.CoursePaymentRepository;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class CourseService {

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    @Autowired
    private CoursePaymentRepository coursePaymentRepository;

    public boolean verifyAndRecordPayment(Map<String, String> params) {
        try {
            String paymentId = params.get("razorpay_payment_id");
            String paymentLinkId = params.get("razorpay_payment_link_id");
            String paymentLinkReferenceId = params.get("razorpay_payment_link_reference_id");
            String paymentLinkStatus = params.get("razorpay_payment_link_status");
            String signature = params.get("razorpay_signature");

            if (paymentId == null || paymentLinkId == null || signature == null) {
                return false;
            }

            // Construct payload for verification
            JSONObject options = new JSONObject();
            options.put("payment_link_id", paymentLinkId);
            options.put("payment_link_reference_id", paymentLinkReferenceId == null ? "" : paymentLinkReferenceId);
            options.put("payment_link_status", paymentLinkStatus);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            // If the secret is the default placeholder, we bypass verification ONLY for local testing.
            // In a real scenario, you should strictly enforce this.
            boolean isValid = false;
            if ("YOUR_SECRET_HERE".equals(razorpaySecret)) {
                // Bypass for placeholder testing if user hasn't configured it yet
                isValid = true;
            } else {
                isValid = Utils.verifyPaymentLink(options, razorpaySecret);
            }

            if (isValid && "paid".equalsIgnoreCase(paymentLinkStatus)) {
                Optional<CoursePayment> existing = coursePaymentRepository.findById(paymentId);
                if (existing.isEmpty()) {
                    CoursePayment payment = new CoursePayment();
                    payment.setPaymentId(paymentId);
                    payment.setPaymentLinkId(paymentLinkId);
                    payment.setDownloaded(false);
                    payment.setCreatedAt(LocalDateTime.now());
                    coursePaymentRepository.save(payment);
                }
                return true;
            }

            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean markAsDownloaded(String paymentId) {
        Optional<CoursePayment> paymentOpt = coursePaymentRepository.findById(paymentId);
        if (paymentOpt.isPresent()) {
            CoursePayment payment = paymentOpt.get();
            if (!payment.isDownloaded()) {
                payment.setDownloaded(true);
                payment.setDownloadedAt(LocalDateTime.now());
                coursePaymentRepository.save(payment);
                return true;
            }
        }
        return false;
    }
}
