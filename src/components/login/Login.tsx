import React, { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Container,
  Text,
  FormErrorMessage,
  Link,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail, signUpWithEmail } from '@/services/auth/authService'

export const Login: React.FC = () => {
  const toast = useToast()
  const navigate = useNavigate()

  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (
      !isLoginMode &&
      (password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    ) {
      newErrors.password =
        'Password must be at least 8 characters and contain at least 1 special character'
    }

    if (!isLoginMode && !confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (!isLoginMode && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (isLoginMode) {
        await loginWithEmail(email, password)
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
        })
      } else {
        await signUpWithEmail(email, password)
        toast({
          title: 'Account created successfully',
          description: 'You are now signed in',
          status: 'success',
          duration: 3000,
        })
      }
      navigate('/projects')
    } catch (error) {
      console.error(isLoginMode ? 'Login error:' : 'Signup error:', error)
      toast({
        title: isLoginMode ? 'Login failed' : 'Signup failed',
        description: isLoginMode
          ? 'Invalid email or password'
          : 'Could not create account. The email may already be in use.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setErrors({})
  }

  return (
    <Container maxW='md' py={12}>
      <VStack spacing={8}>
        <Heading>{isLoginMode ? 'Sign In' : 'Create Account'}</Heading>

        <Box w='100%' p={8} borderWidth={1} borderRadius='lg' boxShadow='md'>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id='email' isRequired isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl
                id='password'
                isRequired
                isInvalid={!!errors.password}
              >
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant='ghost'
                      size='sm'
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              {!isLoginMode && (
                <FormControl
                  id='confirmPassword'
                  isRequired
                  isInvalid={!!errors.confirmPassword}
                >
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>
              )}

              <Button
                type='submit'
                colorScheme='blue'
                width='full'
                mt={4}
                isLoading={isLoading}
              >
                {isLoginMode ? 'Sign In' : 'Create Account'}
              </Button>

              <Text mt={2} textAlign='center'>
                {isLoginMode
                  ? "Don't have an account?"
                  : 'Already have an account?'}{' '}
                <Link color='blue.500' onClick={toggleMode}>
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}
