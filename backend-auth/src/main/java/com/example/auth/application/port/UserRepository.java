package com.example.auth.application.port;

import com.example.auth.domain.User;
import java.util.Optional;

public interface UserRepository {
  Optional<User> findById(String id);
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  void save(User user); // upsert trong transaction
}
