package com.crewcanvas.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "polls")
public class Poll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String question;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PollOption> options = new ArrayList<>();

    public Poll() {}

    public Poll(String question) {
        this.question = question;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public List<PollOption> getOptions() {
        return options;
    }

    public void setOptions(List<PollOption> options) {
        this.options = options;
    }

    public void addOption(PollOption option) {
        options.add(option);
        option.setPoll(this);
    }

    // Frontend Compatibility helpers
    @Transient
    private java.util.Map<Long, Integer> pollVotes;

    @com.fasterxml.jackson.annotation.JsonProperty("pollVotes")
    public java.util.Map<Long, Integer> getPollVotes() {
        return pollVotes;
    }

    public void setPollVotes(java.util.Map<Long, Integer> pollVotes) {
        this.pollVotes = pollVotes;
    }
}
