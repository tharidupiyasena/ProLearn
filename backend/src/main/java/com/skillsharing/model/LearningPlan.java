
package com.skillsharing.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

// import lombok.Data;

// @Data
@Document(collection = "learning-plans")
public class LearningPlan {
    
    @Id
    private String id;
    private String userId;
    // @NotBlank(message = "Title is required")
    private String title;
    private String description;
    private List<Resource> resources;
    private List<Week> weeks;
    private String sourcePlanId;

    public LearningPlan() {}

    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }     
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public List<Resource> getResources() {
        return resources;
    }
    public void setResources(List<Resource> resources) {
        this.resources = resources;
    }
    public List<Week> getWeeks() {
        return weeks;
    }
    public void setWeeks(List<Week> weeks) {
        this.weeks = weeks;
    }
    public String getSourcePlanId() {
        return sourcePlanId;
    }

    public void setSourcePlanId(String sourcePlanId) {
        this.sourcePlanId = sourcePlanId;
    }  
}
