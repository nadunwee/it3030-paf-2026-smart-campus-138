package com.smartcampus.config;

import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class DataInitializer {

    @Bean
    @Profile("!test")
    public CommandLineRunner initData(UserRepository userRepository, ResourceRepository resourceRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setEmail("admin@smartcampus.lk");
                admin.setName("System Admin");
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);

                User tech = new User();
                tech.setEmail("tech@smartcampus.lk");
                tech.setName("John Technician");
                tech.setRole(User.Role.TECHNICIAN);
                userRepository.save(tech);

                User user = new User();
                user.setEmail("student@smartcampus.lk");
                user.setName("Alice Student");
                user.setRole(User.Role.USER);
                userRepository.save(user);
            }

            if (resourceRepository.count() == 0) {
                Resource r1 = new Resource();
                r1.setName("Lecture Hall A");
                r1.setType(Resource.ResourceType.LECTURE_HALL);
                r1.setCapacity(150);
                r1.setLocation("Block A, Floor 1");
                r1.setAvailabilityWindows("Mon-Fri 08:00-20:00");
                r1.setStatus(Resource.ResourceStatus.ACTIVE);
                r1.setDescription("Main lecture hall with projector and whiteboard");
                resourceRepository.save(r1);

                Resource r2 = new Resource();
                r2.setName("Computer Lab 01");
                r2.setType(Resource.ResourceType.LAB);
                r2.setCapacity(40);
                r2.setLocation("Block B, Floor 2");
                r2.setAvailabilityWindows("Mon-Sat 08:00-18:00");
                r2.setStatus(Resource.ResourceStatus.ACTIVE);
                r2.setDescription("Computing lab with 40 workstations");
                resourceRepository.save(r2);

                Resource r3 = new Resource();
                r3.setName("Meeting Room 3");
                r3.setType(Resource.ResourceType.MEETING_ROOM);
                r3.setCapacity(12);
                r3.setLocation("Block C, Floor 3");
                r3.setAvailabilityWindows("Mon-Fri 09:00-17:00");
                r3.setStatus(Resource.ResourceStatus.ACTIVE);
                r3.setDescription("Small meeting room with video conferencing");
                resourceRepository.save(r3);

                Resource r4 = new Resource();
                r4.setName("Projector PJ-101");
                r4.setType(Resource.ResourceType.EQUIPMENT);
                r4.setLocation("Equipment Store, Block A");
                r4.setAvailabilityWindows("Mon-Fri 08:00-20:00");
                r4.setStatus(Resource.ResourceStatus.ACTIVE);
                r4.setDescription("Portable 4K projector");
                resourceRepository.save(r4);

                Resource r5 = new Resource();
                r5.setName("Science Lab");
                r5.setType(Resource.ResourceType.LAB);
                r5.setCapacity(30);
                r5.setLocation("Block D, Floor 1");
                r5.setAvailabilityWindows("Mon-Fri 08:00-17:00");
                r5.setStatus(Resource.ResourceStatus.OUT_OF_SERVICE);
                r5.setDescription("Science lab - currently under maintenance");
                resourceRepository.save(r5);
            }
        };
    }
}
