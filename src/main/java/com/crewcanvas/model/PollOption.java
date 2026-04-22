package com.crewcanvas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "poll_options")
public class PollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String optionText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id")
    @JsonIgnore
    private Poll poll;

    public PollOption() {}

    public PollOption(String optionText) {
        this.optionText = optionText;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }

    public Poll getPoll() {
        return poll;
    }

    public void setPoll(Poll poll) {
        this.poll = poll;
    }
}
