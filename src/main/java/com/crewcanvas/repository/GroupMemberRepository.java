package com.crewcanvas.repository;

import com.crewcanvas.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupChatId(Long groupId);
    Optional<GroupMember> findByGroupChatIdAndUserId(Long groupId, Long userId);
}
