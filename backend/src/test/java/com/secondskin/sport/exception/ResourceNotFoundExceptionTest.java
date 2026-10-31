package com.secondskin.sport.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ResourceNotFoundException Unit Tests")
public class ResourceNotFoundExceptionTest {

    @Test
    @DisplayName("Exception is annotated with @ResponseStatus(HttpStatus.NOT_FOUND)")
    void testAnnotationPresent() {
        ResponseStatus annotation = ResourceNotFoundException.class.getAnnotation(ResponseStatus.class);
        assertNotNull(annotation, "ResourceNotFoundException must have @ResponseStatus annotation");
        assertEquals(HttpStatus.NOT_FOUND, annotation.value());
    }

    @Test
    @DisplayName("Constructor sets message correctly")
    void testConstructorWithMessage() {
        String message = "Session not found with id 42";
        ResourceNotFoundException ex = new ResourceNotFoundException(message);
        assertEquals(message, ex.getMessage());
    }

    @Test
    @DisplayName("Constructor sets message and cause correctly")
    void testConstructorWithMessageAndCause() {
        String message = "Device not found";
        IllegalArgumentException cause = new IllegalArgumentException("Invalid ID");
        ResourceNotFoundException ex = new ResourceNotFoundException(message, cause);
        assertEquals(message, ex.getMessage());
        assertEquals(cause, ex.getCause());
    }
}
