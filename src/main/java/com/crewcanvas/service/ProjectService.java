package com.crewcanvas.service;

import com.crewcanvas.model.Project;
import com.crewcanvas.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserService userService;

    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    public List<Project> getUserProjects(Long userId) {
        return projectRepository.findByUserIdOrderByYearDesc(userId);
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public Project updateProject(Long id, Project updatedProject) {
        Optional<Project> projectOpt = projectRepository.findById(id);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            if (updatedProject.getTitle() != null)
                project.setTitle(updatedProject.getTitle());
            if (updatedProject.getDescription() != null)
                project.setDescription(updatedProject.getDescription());
            if (updatedProject.getGenre() != null)
                project.setGenre(updatedProject.getGenre());
            if (updatedProject.getRole() != null)
                project.setRole(updatedProject.getRole());
            if (updatedProject.getYear() != null)
                project.setYear(updatedProject.getYear());
            if (updatedProject.getImageUrl() != null)
                project.setImageUrl(updatedProject.getImageUrl());
            if (updatedProject.getVideoUrl() != null)
                project.setVideoUrl(updatedProject.getVideoUrl());
            return projectRepository.save(project);
        }
        throw new RuntimeException("Project not found");
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    public Project verifyProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        project.setVerified(true);
        Project saved = projectRepository.save(project);

        // Promote user to Film Professional status upon verification of a project
        userService.findById(project.getUserId()).ifPresent(user -> {
            user.setIsVerifiedProfessional(true);
            userService.updateProfile(user);
        });

        return saved;
    }
}
